// src/app/api/webhooks/paystack/transfer-handlers.js

/**
 * HANDLER 7: Processes successful bank transfer payouts.
 * Uses exact withdrawal UUID to update the tracking table and individual ledger elements cleanly.
 */
export async function handleTransferSuccess(supabaseAdmin, eventData) {
    const reasonText = eventData.reason || "";
    const transferCode = eventData.transfer_code || null;

    let targetWithdrawalId = null;
    const lookupSplits = reasonText.split('STIMS Withdrawal Reference ID: ');
    if (lookupSplits.length > 1) {
        targetWithdrawalId = lookupSplits[1].trim();
    }

    if (!targetWithdrawalId) {
        console.warn('⚠️ [Transfer Success Webhook]: Unable to resolve target withdrawal UUID from transfer descriptor text strings. Querying via transfer_code.');

        const { data: matchedWithdrawal } = await supabaseAdmin
            .from('referral_payouts_withdrawals')
            .select('id')
            .eq('paystack_transfer_code', transferCode)
            .maybeSingle();

        if (matchedWithdrawal) targetWithdrawalId = matchedWithdrawal.id;
    }

    if (!targetWithdrawalId) {
        console.error('🚨 [Transfer Success Webhook Fatal Error]: No tracking reference found in data schema logs.');
        return;
    }

    const timestamp = new Date().toISOString();

    const { error: withdrawalsErr } = await supabaseAdmin
        .from('referral_payouts_withdrawals')
        .update({ status: 'success', updated_at: timestamp })
        .eq('id', targetWithdrawalId);

    if (withdrawalsErr) throw withdrawalsErr;

    const { error: ledgerErr } = await supabaseAdmin
        .from('referral_payouts_ledger')
        .update({ payout_status: 'paid', updated_at: timestamp })
        .eq('withdrawal_id', targetWithdrawalId);

    if (ledgerErr) throw ledgerErr;

    console.log(`✅ [Transfer Success Webhook Handled]: Finalized withdrawal ID: ${targetWithdrawalId} and updated tracking ledger lines successfully.`);
}

/**
 * HANDLER 8: Processes rejected or bounced bank transfer payouts.
 * Sets withdrawal record status to 'failed' and cleanly rolls back the linked ledger rows back to 'unpaid'.
 */
export async function handleTransferFailure(supabaseAdmin, eventData) {
    const reasonText = eventData.reason || "";
    const transferCode = eventData.transfer_code || null;
    const gatewayMessage = eventData.fail_reason || eventData.status || "Bank transfer rejected by clearing gateway.";

    let targetWithdrawalId = null;
    const lookupSplits = reasonText.split('STIMS Withdrawal Reference ID: ');
    if (lookupSplits.length > 1) {
        targetWithdrawalId = lookupSplits[1].trim();
    }

    if (!targetWithdrawalId) {
        const { data: matchedWithdrawal } = await supabaseAdmin
            .from('referral_payouts_withdrawals')
            .select('id')
            .eq('paystack_transfer_code', transferCode)
            .maybeSingle();

        if (matchedWithdrawal) targetWithdrawalId = matchedWithdrawal.id;
    }

    if (!targetWithdrawalId) {
        console.error('🚨 [Transfer Failure Webhook Fatal Error]: Unable to trace referenced withdrawal item inside index.');
        return;
    }

    const timestamp = new Date().toISOString();

    const { error: withdrawalsErr } = await supabaseAdmin
        .from('referral_payouts_withdrawals')
        .update({
            status: 'failed',
            failure_reason: gatewayMessage,
            updated_at: timestamp
        })
        .eq('id', targetWithdrawalId);

    if (withdrawalsErr) throw withdrawalsErr;

    const { error: ledgerErr } = await supabaseAdmin
        .from('referral_payouts_ledger')
        .update({
            payout_status: 'unpaid',
            withdrawal_id: null,
            updated_at: timestamp
        })
        .eq('withdrawal_id', targetWithdrawalId);

    if (ledgerErr) throw ledgerErr;

    console.log(`⚠️ [Transfer Failure Webhook Handled]: Reverted withdrawal session ID: ${targetWithdrawalId} back to unpaid balances pool. Reason trace logged.`);
}
