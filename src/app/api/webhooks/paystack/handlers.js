// src/app/api/webhooks/paystack/handlers.js

export { handleChargeSuccess, handleSubscriptionCreate, handleSubscriptionNotRenew } from './primary-handlers';

/**
 * HANDLER 4: Handles the absolute end of the paid month interval.
 */
export async function handleSubscriptionDisable(supabaseAdmin, eventData, userId, resolvedAppId) {
    const targetSubCode = (eventData.subscription_code || "").trim();

    const { data: updatedSubRows, error: downgradeError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            tier: 'free',
            status: 'cancelled',
            cancel_reason: 'Subscription paid term cycle reached its final period boundary limit and completely deactivated.',
            updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', targetSubCode)
        .select('user_id');

    if (downgradeError) throw new Error(`Database downgrade deallocation error: ${downgradeError.message}`);

    if (updatedSubRows && updatedSubRows.length > 0) {
        const trueOwnerId = updatedSubRows[0].user_id;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
            .eq('user_id', trueOwnerId);

        const { error: vehicleDeactivateError } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .update({ is_active: false })
            .eq('user_id', trueOwnerId);

        if (vehicleDeactivateError) console.error(`[Webhook Vehicle Deactivation Fault]: ${vehicleDeactivateError.message}`);
        console.log(`🚫 [Paystack Webhook Deactivation]: Paid term expired for signature ${targetSubCode}. Downgraded user ${trueOwnerId} to Sandbox limits.`);
    } else {
        console.log(`⚠️ [Paystack Webhook Bypassed]: Bypassed resource downgrade because no active database subscription matched code: ${targetSubCode}`);
    }
}

/**
 * HANDLER 5: Processes monthly recurring automatic billing cycle invoice renewals.
 */
export async function handleInvoiceUpdate(supabaseAdmin, eventData, userId, resolvedAppId) {
    const invoiceStatus = (eventData.status || "").toLowerCase();
    if (invoiceStatus !== 'success') return;

    const paidAt = eventData.paid_at || new Date().toISOString();
    const nextPeriodEnd = new Date(paidAt);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);

    const realEmailToken = eventData.email_token ||
        eventData.authorization?.email_token ||
        eventData.subscription?.email_token ||
        eventData.plan?.email_token ||
        null;

    const { data: updatedSubRows, error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'active',
            tier: 'premium',
            paystack_email_token: realEmailToken,
            current_period_start: paidAt,
            current_period_end: eventData.subscription?.next_payment_date || nextPeriodEnd.toISOString(),
            cancel_reason: null,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId)
        .select('user_id');

    if (error) throw new Error(`Database invoice renewal extension dropped: ${error.message}`);

    if (updatedSubRows && updatedSubRows.length > 0) {
        const trueOwnerId = updatedSubRows[0].user_id;

        const { error: tokenResetError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: 0,
                usage_limit_cap: 3000,
                last_reset_period: paidAt.split('T')[0],
                updated_at: new Date().toISOString()
            })
            .eq('user_id', trueOwnerId);

        if (tokenResetError) console.error("⚠️ Token usage reset on invoice update dropped:", tokenResetError.message);
        console.log(`🔁 [Paystack Webhook Auto-Renew]: Extended monthly accounting cycle & reset quotas for user ${trueOwnerId} successfully.`);
    } else {
        console.log(`⚠️ [Paystack Invoice Bypass]: Bypassed quota reset because no operational subscription target matched user ${userId}.`);
    }
}

/**
 * HANDLER 6: Intercepts recurring payment loop bank collection failures.
 */
export async function handlePaymentFailure(supabaseAdmin, eventData, eventName, userId, resolvedAppId) {
    const { data: updatedSubRows, error: cancelError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'cancelled',
            tier: 'free',
            cancel_reason: `Automatic recurring collection loop failure event caught: ${eventName}`,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId)
        .select('user_id');

    if (cancelError) throw new Error(`Database cancellation failure update error: ${cancelError.message}`);

    if (updatedSubRows && updatedSubRows.length > 0) {
        const trueOwnerId = updatedSubRows[0].user_id;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
            .eq('user_id', trueOwnerId);

        await supabaseAdmin
            .from('ecoroute_vehicles')
            .update({ is_active: false })
            .eq('user_id', trueOwnerId);

        console.log(`⚠️ [Paystack Webhook Bank Failure]: Collection loop failed. Restricted user ${trueOwnerId} to Sandbox limits.`);
    } else {
        console.log(`⚠️ [Paystack Failure Bypass]: Bypassed sandbox resource drop because no active subscription was found for user ${userId}.`);
    }
}
