// src/app/api/referrals/withdraw/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    // 1. Initialize admin client to update financial ledger tracking layers safely
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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

        // 2. Fetch the user's details and verify their current unpaid ledger balance
        const [profileRes, ledgerRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('first_name, surname').eq('id', userId).maybeSingle(),
            supabaseAdmin.from('referral_payouts_ledger').select('amount_cents').eq('referrer_id', userId).eq('payout_status', 'unpaid')
        ]);

        const totalUnpaidCents = (ledgerRes.data || []).reduce((sum, row) => sum + row.amount_cents, 0);
        const payoutAmountZar = totalUnpaidCents / 100;

        // Enforce the R100 minimum payout safety threshold constraint rule
        if (payoutAmountZar < 100) {
            return NextResponse.json({ success: false, error: "Insufficient funds. Minimum withdrawal is R100.00 ZAR." }, { status: 422 });
        }

        const holderName = `${profileRes.data?.first_name || ''} ${profileRes.data?.surname || ''}`.trim() || 'STIMS Partner';

        // =========================================================================
        // PAYSTACK STEP A: CREATE TRANSFER RECIPIENT
        // =========================================================================
        const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: "nuban",
                name: holderName,
                account_number: accountNum.trim(),
                bank_code: bankCode.trim(), // Paystack bank code handles institution routing natively
                currency: "ZAR"
            })
        });

        const recipientResult = await recipientResponse.json();
        if (!recipientResult.status) {
            throw new Error(`Paystack recipient creation rejected: ${recipientResult.message}`);
        }

        const recipientCode = recipientResult.data.recipient_code; // Looks like: RCP_xxxxxxxxxxxxxxx

        // =========================================================================
        // PAYSTACK STEP B: INITIATE SECURE BANK TRANSFER DISBURSEMENT
        // =========================================================================
        const transferResponse = await fetch("https://api.paystack.co/transfer", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: "balance", // Disburses cash straight from your active Paystack account balance pool
                amount: totalUnpaidCents, // Amount in cents natively
                recipient: recipientCode,
                reason: `STIMS Affiliate Distribution ID: ${userId.substring(0, 8)}`
            })
        });

        const transferResult = await transferResponse.json();

        // Handle name mismatches, invalid bank accounts, or low developer fund balances safely
        if (!transferResult.status) {
            throw new Error(`Paystack transfer execution rejected: ${transferResult.message}`);
        }

        // =========================================================================
        // STEP 3: UPDATE DB LEDGER STATUS PATH ON GATEWAY DISPATCH SUCCESS
        // =========================================================================
        const { error: ledgerError } = await supabaseAdmin
            .from('referral_payouts_ledger')
            .update({
                payout_status: 'processing', // Shifts to processing state while bank settlement cycles run
                updated_at: new Date().toISOString()
            })
            .eq('referrer_id', userId)
            .eq('payout_status', 'unpaid');

        if (ledgerError) {
            console.error("🚨 Ledger status sync error:", ledgerError.message);
        }

        return NextResponse.json({
            success: true,
            message: `Disbursement session finalized successfully. R${payoutAmountZar.toFixed(2)} sent via transfer ID: ${transferResult.data.transfer_code}`
        }, { status: 200 });

    } catch (err) {
        console.error("🚨 Actual Cashout Process Failure:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}