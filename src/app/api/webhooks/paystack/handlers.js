// /src/app/api/webhooks/paystack/handlers.js

/**
 * HANDLER 1: Processes successful incoming merchant checkout credit card captures.
 * Sets user allocations state records to active and backfills subscription counters.
 */
export async function handleChargeSuccess(supabaseAdmin, eventData, userId, resolvedAppId) {
    const periodStart = eventData.paid_at || new Date().toISOString();
    const calculatedEnd = new Date(periodStart);
    calculatedEnd.setDate(calculatedEnd.getDate() + 30);

    const subscriptionCodeToken = eventData.subscription_code || eventData.subscription?.subscription_code || null;
    const realEmailToken = eventData.email_token || eventData.subscription?.email_token || null;

    // 1. Instantly log active licensing row metrics to the user subscriptions registry table
    const { error: subUpsertError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(
            {
                user_id: userId,
                app_id: resolvedAppId,
                tier: 'premium',
                status: 'active',
                plan_amount_cents: eventData.amount || 0,
                currency: eventData.currency || 'ZAR',
                stripe_customer_id: eventData.customer?.customer_code || null,
                stripe_subscription_id: subscriptionCodeToken,
                paystack_email_token: realEmailToken, // Ensure email token is saved here too
                current_period_start: periodStart,
                current_period_end: eventData.next_payment_date || calculatedEnd.toISOString(),
                cancel_reason: "Premium billing transaction fully verified and processed via Paystack webhook channels.",
                user_email: eventData.customer?.email || 'no-email-found@stims.co.za',
                updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,app_id' }
        );

    if (subUpsertError) throw new Error(`Subscription state upsert sync dropped: ${subUpsertError.message}`);

    // 2. ATOMIC QUOTA PROVISIONER LOOP: Instantly upgrade their corporate api tokens limits cap to 3,000 requests
    const { data: existingTokenRecord } = await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    // Reconstruct key fallback parameter metrics securely using global crypto API
    const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    const { error: tokenUpdateError } = await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .upsert({
            id: existingTokenRecord?.id || undefined,
            user_id: userId,
            organization_name: existingTokenRecord?.organization_name || 'Premium Corporate Enterprise',
            api_token: existingTokenRecord?.api_token || secureHexKey,
            current_monthly_usage: 0,
            usage_limit_cap: 3000,
            total_accrued_tax_liability_zar: existingTokenRecord?.total_accrued_tax_liability_zar || 0.00,
            last_reset_period: periodStart.split('T')[0],
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (tokenUpdateError) throw new Error(`Atomic token limit allocation upgrade dropped: ${tokenUpdateError.message}`);
    console.log(`🎉 [Paystack Webhook Success]: Upgraded user ${userId} and allocated 3,000 requests capacity slots safely.`);
}

/**
 * HANDLER 2: Processes direct recurring subscription initialization events.
 */
export async function handleSubscriptionCreate(supabaseAdmin, eventData, userId, resolvedAppId) {
    // FIXED RESOLUTION FALLBACK: Looks inside child objects for valid contract references
    const realSubscriptionCode = (eventData.subscription_code || eventData.subscription?.subscription_code || "").trim();
    const realEmailToken = (eventData.email_token || eventData.subscription?.email_token || "").trim();
    const periodStart = eventData.created_at || new Date().toISOString();

    if (!realSubscriptionCode || !realSubscriptionCode.startsWith('SUB_')) {
        console.warn(`[Subscription Create Warning]: Received a non-standard initialization code frame context: "${realSubscriptionCode}". Bypassing hard crash.`);
    }

    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            stripe_subscription_id: realSubscriptionCode || null,
            paystack_email_token: realEmailToken || null,
            stripe_customer_id: eventData.customer?.customer_code || null,
            status: 'active',
            tier: 'premium',
            current_period_start: periodStart,
            current_period_end: eventData.next_payment_date || eventData.subscription?.next_payment_date,
            cancel_reason: "Subscription successfully mapped via programmatic billing webhook tracking cycles.",
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database subscription create update error: ${error.message}`);
    console.log(`[Paystack Webhook Sync]: Verified subscription creation loop code: ${realSubscriptionCode}`);
}

/**
 * HANDLER 3: Handles standard customer cancellation auto-renewal termination requests.
 * Sets status to 'cancelling' so the frontend can display a cancellation notice and a manual renewal button.
 */
export async function handleSubscriptionNotRenew(supabaseAdmin, eventData, userId, resolvedAppId) {
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'cancelling', // FIXED: Refined status so frontend recognizes pending termination vs healthy active state
            tier: 'premium',      // Premium access remains explicitly intact until period expiration boundary
            cancel_reason: 'User disabled automatic payment renewals. Premium features capacity preserved until billing cutoff date.',
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database subscription cancel update fault: ${error.message}`);
    console.log(`[Paystack Webhook Cancel Link]: Auto-renew disabled for user ${userId}. Status updated to 'cancelling' with access intact.`);
}




/**
 * HANDLER 4: Handles the absolute end of the paid month interval.
 */
export async function handleSubscriptionDisable(supabaseAdmin, eventData, userId, resolvedAppId) {
    const { error: downgradeError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            tier: 'free',
            status: 'cancelled',
            cancel_reason: 'Subscription paid term cycle reached its final period boundary limit and completely deactivated.',
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (downgradeError) throw new Error(`Database downgrade deallocation error: ${downgradeError.message}`);

    await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    const { error: vehicleDeactivateError } = await supabaseAdmin
        .from('ecoroute_vehicles')
        .update({ is_active: false })
        .eq('user_id', userId);

    if (vehicleDeactivateError) console.error(`[Webhook Vehicle Deactivation Fault]: ${vehicleDeactivateError.message}`);
    console.log(`🚫 [Paystack Webhook Deactivation]: Paid term expired. Downgraded user ${userId} to Sandbox limits.`);
}

/**
 * HANDLER 5: Processes monthly recurring automatic billing cycle invoice renewals.
 * FIXED: Now flushes current_monthly_usage to 0 and updates last_reset_period securely.
 */
export async function handleInvoiceUpdate(supabaseAdmin, eventData, userId, resolvedAppId) {
    const invoiceStatus = (eventData.status || "").toLowerCase();
    if (invoiceStatus !== 'success') return;

    const paidAt = eventData.paid_at || new Date().toISOString();
    const nextPeriodEnd = new Date(paidAt);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);

    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'active',
            tier: 'premium',
            current_period_start: paidAt,
            current_period_end: eventData.subscription?.next_payment_date || nextPeriodEnd.toISOString(),
            cancel_reason: null,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database invoice renewal extension dropped: ${error.message}`);

    // FIXED ATOMIC FLUSH: Reset the usage counter on invoice success payment loops
    const { error: tokenResetError } = await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .update({
            current_monthly_usage: 0,
            usage_limit_cap: 3000,
            last_reset_period: paidAt.split('T')[0],
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (tokenResetError) console.error(`⚠️ Token usage reset on invoice update dropped: ${tokenResetError.message}`);
    console.log(`🔁 [Paystack Webhook Auto-Renew]: Extended monthly accounting cycle & reset quotas for user ${userId} successfully.`);
}

/**
 * HANDLER 6: Intercepts recurring payment loop bank collection failures.
 */
export async function handlePaymentFailure(supabaseAdmin, eventData, eventName, userId, resolvedAppId) {
    const { error: cancelError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'cancelled',
            tier: 'free',
            cancel_reason: `Automatic recurring collection loop failure event caught: ${eventName}`,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (cancelError) throw new Error(`Database cancellation failure update error: ${cancelError.message}`);

    await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    await supabaseAdmin.from('ecoroute_vehicles').update({ is_active: false }).eq('user_id', userId);
    console.log(`⚠️ [Paystack Webhook Bank Failure]: Collection loop failed. Restricted user ${userId} to Sandbox limits.`);
}
