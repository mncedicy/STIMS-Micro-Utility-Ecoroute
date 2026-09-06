// src/app/api/referrals/withdraw/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const BANK_MAP = {
    "051001": "First National Bank (FNB)",
    "632005": "ABSA",
    "198765": "Nedbank",
    "470010": "Capitec",
    "678910": "TymeBank"
};

export async function POST(req) {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const body = await req.json();
        const { userId, bankCode, accountNum } = body;

        if (!userId || !bankCode || !accountNum) {
            return NextResponse.json({ success: false, error: "Missing required withdrawal fields." }, { status: 400 });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ success: false, error: "Server gateway configuration mismatch." }, { status: 500 });
        }

        const friendlyBankName = BANK_MAP[bankCode] || `Bank Code (${bankCode})`;

        // 1. Fetch profile and verify their outstanding unpaid items balance from ledger
        const [profileRes, ledgerRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('first_name, surname').eq('id', userId).maybeSingle(),
            supabaseAdmin.from('referral_payouts_ledger').select('id, amount_cents').eq('referrer_id', userId).eq('payout_status', 'unpaid')
        ]);

        const actualReferrerName = `${profileRes.data?.first_name || ''} ${profileRes.data?.surname || ''}`.trim() || 'STIMS Partner';
        const ledgerItems = ledgerRes.data || [];
        const totalUnpaidCents = ledgerItems.reduce((sum, row) => sum + row.amount_cents, 0);
        const payoutAmountZar = totalUnpaidCents / 100;

        if (payoutAmountZar < 100) {
            return NextResponse.json({ success: false, error: "Insufficient funds. Minimum withdrawal is R100.00 ZAR." }, { status: 422 });
        }

        // =========================================================================
        // STEP A: INITIALIZE WITHDRAWAL ATTEMPT WITH ACTUAL ACCOUNT HOLDER NAME
        // =========================================================================
        const { data: withdrawalRecord, error: initError } = await supabaseAdmin
            .from('referral_payouts_withdrawals')
            .insert({
                referrer_id: userId,
                referrer_name: actualReferrerName, // Saved actual profile name trace parameter natively
                amount_cents: totalUnpaidCents,
                bank_name: friendlyBankName,
                account_number: accountNum.trim(),
                status: 'processing'
            })
            .select()
            .single();

        if (initError) throw new Error(`Could not generate withdrawal trace logs: ${initError.message}`);

        // =========================================================================
        // STEP B: MOCK INTERCEPTOR FOR LOCAL ENVIRONMENT TEST SUITE RUNS
        // =========================================================================
        const isTestMode = secretKey.trim().startsWith('sk_test_');

        if (isTestMode) {
            console.log('🧪 [MOCK DISBURSEMENT]: Test key detected. Auto-finalizing withdrawal records...');

            await Promise.all([
                supabaseAdmin.from('referral_payouts_withdrawals').update({
                    status: 'success', paystack_transfer_code: `TRF_MOCK_${Date.now()}`, updated_at: new Date().toISOString()
                }).eq('id', withdrawalRecord.id),
                supabaseAdmin.from('referral_payouts_ledger').update({
                    payout_status: 'paid', withdrawal_id: withdrawalRecord.id, updated_at: new Date().toISOString()
                }).eq('referrer_id', userId).eq('payout_status', 'unpaid')
            ]);

            return NextResponse.json({
                success: true,
                message: `[TEST MODE] Withdrawal successful! R${payoutAmountZar.toFixed(2)} processed via local environment simulation loop.`
            }, { status: 200 });
        }

        // =========================================================================
        // STEP C: LIVE PRODUCTION TRANSACTION CHANNEL PROCESSING
        // =========================================================================
        try {
            // Paystack Step 1: Create Transfer Recipient utilizing actual name context variables
            const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${secretKey.trim()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: "nuban",
                    name: actualReferrerName, // Replaced static placeholder string with actual user name variables
                    account_number: accountNum.trim(),
                    bank_code: bankCode.trim(),
                    currency: "ZAR"
                })
            });
            const recipientResult = await recipientResponse.json();
            if (!recipientResult.status) throw new Error(recipientResult.message);

            const recipientCode = recipientResult.data.recipient_code;

            // Save recipient code link on tracking records row
            await supabaseAdmin.from('referral_payouts_withdrawals').update({ paystack_recipient_code: recipientCode }).eq('id', withdrawalRecord.id);

            // Paystack Step 2: Fire Automated Bank Transfer Execution Loop
            const transferResponse = await fetch("https://api.paystack.co/transfer", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${secretKey.trim()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: "balance",
                    amount: totalUnpaidCents,
                    recipient: recipientCode,
                    reason: `STIMS Withdrawal Reference ID: ${withdrawalRecord.id}` // Passing transaction unique uuid token for accurate webhook mapping
                })
            });
            const transferResult = await transferResponse.json();

            if (!transferResult.status) throw new Error(transferResult.message);

            // Link ledger lines to our withdrawals table row container ID tracking pointer
            await Promise.all([
                supabaseAdmin.from('referral_payouts_withdrawals').update({ paystack_transfer_code: transferResult.data.transfer_code }).eq('id', withdrawalRecord.id),
                supabaseAdmin.from('referral_payouts_ledger').update({
                    payout_status: 'processing', withdrawal_id: withdrawalRecord.id, updated_at: new Date().toISOString()
                }).eq('referrer_id', userId).eq('payout_status', 'unpaid')
            ]);

            return NextResponse.json({ success: true, message: `Disbursement completed. R${payoutAmountZar.toFixed(2)} is processing.` }, { status: 200 });

        } catch (apiErr) {
            await supabaseAdmin.from('referral_payouts_withdrawals').update({
                status: 'failed', failure_reason: apiErr.message, updated_at: new Date().toISOString()
            }).eq('id', withdrawalRecord.id);

            throw apiErr;
        }

    } catch (err) {
        console.error("🚨 Cashout Process Failure:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}