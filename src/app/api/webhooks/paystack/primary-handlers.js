// src/app/api/webhooks/paystack/primary-handlers.js

import crypto from 'crypto';

/**
 * HANDLER 1: Processes successful incoming merchant checkout credit card captures.
 * Safe to arrive first or second.
 */
export async function handleChargeSuccess(supabaseAdmin, eventData, userId, resolvedAppId) {
    const periodStart = eventData.paid_at || new Date().toISOString();
    const calculatedEnd = new Date(periodStart);
    calculatedEnd.setDate(calculatedEnd.getDate() + 30);

    const subscriptionCodeToken = eventData.subscription_code || eventData.subscription?.subscription_code || null;

    const realEmailToken = eventData.email_token ||
        eventData.authorization?.email_token ||
        eventData.subscription?.email_token ||
        eventData.plan?.email_token ||
        null;

    // 1. Idempotent upsert sync
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
                paystack_email_token: realEmailToken,
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
 * FIXED: Converted from .update() to .upsert() to ensure absolute safety if this event arrives before charge.success
 */
export async function handleSubscriptionCreate(supabaseAdmin, eventData, userId, resolvedAppId) {
    const realSubscriptionCode = (eventData.subscription_code || eventData.subscription?.subscription_code || "").trim();

    const realEmailToken = (eventData.email_token ||
        eventData.authorization?.email_token ||
        eventData.subscription?.email_token ||
        eventData.plan?.email_token ||
        "").trim();

    const periodStart = eventData.created_at || new Date().toISOString();
    const calculatedEnd = new Date(periodStart);
    calculatedEnd.setDate(calculatedEnd.getDate() + 30);

    if (!realSubscriptionCode || !realSubscriptionCode.startsWith('SUB_')) {
        console.warn(`[Subscription Create Warning]: Received a non-standard initialization code frame context: "${realSubscriptionCode}". Bypassing hard crash.`);
    }

    // FIXED FOR PRODUCTION: Uses upsert to handle cases where subscription.create lands first
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            app_id: resolvedAppId,
            stripe_subscription_id: realSubscriptionCode || null,
            paystack_email_token: realEmailToken || null,
            stripe_customer_id: eventData.customer?.customer_code || null,
            user_email: eventData.customer?.email || 'no-email-found@stims.co.za',
            status: 'active',
            tier: 'premium',
            current_period_start: periodStart,
            current_period_end: eventData.next_payment_date || eventData.subscription?.next_payment_date || calculatedEnd.toISOString(),
            cancel_reason: "Subscription successfully mapped via programmatic billing webhook tracking cycles.",
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,app_id' });

    if (error) throw new Error(`Database subscription create upsert error: ${error.message}`);
    console.log(`[Paystack Webhook Sync]: Verified subscription creation loop code via upsert: ${realSubscriptionCode}`);
}

/**
 * HANDLER 3: Handles standard customer cancellation auto-renewal termination requests.
 */
export async function handleSubscriptionNotRenew(supabaseAdmin, eventData, userId, resolvedAppId) {
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: 'cancelling',
            tier: 'premium',
            cancel_reason: 'User disabled automatic payment renewals. Premium features capacity preserved until billing cutoff date.',
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', resolvedAppId);

    if (error) throw new Error(`Database subscription cancel update fault: ${error.message}`);
    console.log(`[Paystack Webhook Cancel Link]: Auto-renew disabled for user ${userId}. Status updated to 'cancelling' with access intact.`);
}
