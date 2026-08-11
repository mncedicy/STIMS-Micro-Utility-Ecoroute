// /src/app/api/webhooks/paystack/handlers.js

/**
 * HANDLER 1: Processes successful incoming merchant checkout credit card captures.
 * Sets user allocations state records to active and backfills subscription counters.
 */
export async function handleChargeSuccess(supabaseAdmin, eventData, userId, resolvedAppId) {
    const periodStart = eventData.paid_at || new Date().toISOString();
    const calculatedEnd = new Date(periodStart);
    calculatedEnd.setDate(calculatedEnd.getDate() + 30);

    // 1. Instantly log active licensing row metrics to the user subscriptions registry table
    const { error: subUpsertError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(
            {
                user_id: userId,
                app_id: resolvedAppId,
                tier: 'premium',
                status: 'active', // Flipped safely to active status
                plan_amount_cents: eventData.amount || 0,
                currency: eventData.currency || 'ZAR',
                stripe_customer_id: eventData.customer?.customer_code || null,
                stripe_subscription_id: eventData.subscription_code || null,
                current_period_start: periodStart,
                current_period_end: eventData.next_payment_date || calculatedEnd.toISOString(),
                cancel_reason: "Premium billing transaction fully verified and processed via Paystack webhook channels.",
                user_email: eventData.customer?.email,
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

    const { error: tokenUpdateError } = await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .upsert({
            id: existingTokenRecord?.id || undefined,
            user_id: userId,
            organization_name: existingTokenRecord?.organization_name || 'Premium Corporate Enterprise',
            api_token: existingTokenRecord?.api_token || `ecoroute_live_${Date.now()}`,
            current_monthly_usage: existingTokenRecord?.current_monthly_usage || 0, // Preserve current consumption
            usage_limit_cap: 3000, // FIXED: Upgraded request slots to 3000 max capacity
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
    const realSubscriptionCode = (eventData.subscription_code || "").trim();
    const periodStart = eventData.created_at || new Date().toISOString();

    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            stripe_subscription_id: realSubscriptionCode,
            stripe_customer_id: eventData.customer?.customer_code || null,
            status: 'active',
            tier: 'premium',
            current_period_start: periodStart,
            current_period_end: eventData.next_payment_date,
            cancel_reason: "Subscription successfully mapped via programmatic billing webhook tracking cycles."
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database subscription create update error: ${error.message}`);
    console.log(`[Paystack Webhook Sync]: Verified subscription creation loop code: ${realSubscriptionCode}`);
}

/**
 * HANDLER 3: Handles standard customer cancellation auto-renewal termination requests.
 * Preserves active features access limits until the exact final paid cycle date arrives.
 */
export async function handleSubscriptionNotRenew(supabaseAdmin, eventData, userId, resolvedAppId) {
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'active', // Access is explicitly kept alive for user security checks compliance
            tier: 'premium',
            cancel_reason: 'User disabled automatic payment renewals. Premium features capacity preserved until billing cutoff date.',
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database subscription cancel update fault: ${error.message}`);
    console.log(`[Paystack Webhook Cancel Link]: Auto-renew disabled for user ${userId}. Access remains intact.`);
}

/**
 * HANDLER 4: Handles the absolute end of the paid month interval.
 * Gracefully downgrades access limits back down to sandbox tier parameters.
 */
export async function handleSubscriptionDisable(supabaseAdmin, eventData, userId, resolvedAppId) {
    const { error: downgradeError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            tier: 'free', // Limit back to standard sandbox values
            status: 'cancelled',
            cancel_reason: 'Subscription paid term cycle reached its final period boundary limit and completely deactivated.',
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (downgradeError) throw new Error(`Database downgrade deallocation error: ${downgradeError.message}`);

    // Atomically limit request counters capacity back down to standard sandbox cap totals (100 max)
    await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    // Turn off extra fleet vehicles logs registration access nodes
    const { error: vehicleDeactivateError } = await supabaseAdmin
        .from('ecoroute_vehicles')
        .update({ is_active: false })
        .eq('user_id', userId);

    if (vehicleDeactivateError) console.error(`[Webhook Vehicle Deactivation Fault]: ${vehicleDeactivateError.message}`);
    console.log(`🚫 [Paystack Webhook Deactivation]: Paid term expired. Downgraded user ${userId} to Sandbox limits.`);
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
    console.log(`🔁 [Paystack Webhook Auto-Renew]: Extended monthly accounting cycle for user ${userId} successfully.`);
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

    // Instantly collapse usage limit capacities back to Sandbox values (100 requests)
    await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .update({ usage_limit_cap: 100, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    // Deactivate custom vehicle profiles assets
    await supabaseAdmin.from('ecoroute_vehicles').update({ is_active: false }).eq('user_id', userId);
    console.log(`⚠️ [Paystack Webhook Bank Failure]: Collection loop failed. Restricted user ${userId} to Sandbox limits.`);
}
