// /src/app/utils/quotaResetEngine.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Calculates whether a date has entered a new month period cycle relative to an anchor day.
 */
function checkPeriodResetAnchor(anchorDateStr) {
    if (!anchorDateStr) return false;

    const anchorDate = new Date(anchorDateStr);
    const today = new Date();

    // Total months elapsed since creation/subscription
    const monthsElapsed = (today.getFullYear() - anchorDate.getFullYear()) * 12 + (today.getMonth() - anchorDate.getMonth());
    if (monthsElapsed <= 0) return false;

    // Projected reset date for the current calendar month
    const targetResetDay = new Date(today.getFullYear(), today.getMonth(), anchorDate.getDate());

    // If today is past or exactly on the anniversary day of the current month, this is the active cycle point
    const activeCycleAnchor = today >= targetResetDay
        ? targetResetDay.toISOString().split('T')[0]
        : new Date(today.getFullYear(), today.getMonth() - 1, anchorDate.getDate()).toISOString().split('T')[0];

    return activeCycleAnchor;
}

/**
 * Validates, auto-resets monthly cycles, or creates missing token and subscription layers dynamically.
 */
export async function syncAndValidateUserQuota(userId) {
    try {
        if (!userId) throw new Error('Missing primary userId token tracking string.');

        // 1. Fetch Subscription State, Token Records, and User Auth metadata concurrently
        let [subRes, tokenRes, userRes] = await Promise.all([
            supabaseAdmin.from('user_subscriptions').select('tier, status, current_period_start').eq('user_id', userId).eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', userId).maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(userId)
        ]);

        // FIXED AUTOMATIC MULTI-TENANT BACKFILL: If no subscription row exists yet for this user, instantiate a Free Tier active row safely
        if (!subRes.data) {
            const signupTimestamp = userRes.data?.user?.created_at || new Date().toISOString();

            const { data: newSubscription, error: subInsertError } = await supabaseAdmin
                .from('user_subscriptions')
                .insert({
                    user_id: userId,
                    app_id: 'ecoroute',
                    tier: 'free',
                    status: 'active',
                    currency: 'ZAR',
                    plan_amount_cents: 0,
                    current_period_start: signupTimestamp,
                    current_period_end: new Date(new Date(signupTimestamp).setMonth(new Date(signupTimestamp).getMonth() + 1)).toISOString()
                })
                .select()
                .single();

            if (subInsertError) {
                console.error('[Quota Engine Subscription Auto-Init Error]:', subInsertError.message);
            } else {
                // Re-assign mutated response parameters smoothly
                subRes.data = newSubscription;
            }
        }

        const isPremium = subRes.data?.tier === 'premium' && subRes.data?.status === 'active';
        const expectedLimit = isPremium ? 3000 : 100;

        // Define anchor reference point: Premium uses billing cycle, Free uses signup date
        const cycleAnchorDate = isPremium
            ? subRes.data?.current_period_start
            : (userRes.data?.user?.created_at || new Date().toISOString());

        const activePeriodKey = checkPeriodResetAnchor(cycleAnchorDate) || new Date(cycleAnchorDate).toISOString().split('T')[0];

        let activeUsage = 0;
        let tokenRecord = tokenRes.data;

        if (tokenRecord) {
            // Check if the database row has processed a reset command for this active cycle period yet
            if (tokenRecord.last_reset_period !== activePeriodKey) {
                // Period shift caught! Auto-reset usage back to 0 and advance the period tracking key
                const { data: updatedToken } = await supabaseAdmin
                    .from('ecoroute_corporate_api_tokens')
                    .update({
                        current_monthly_usage: 0,
                        usage_limit_cap: expectedLimit,
                        last_reset_period: activePeriodKey,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .select()
                    .single();

                tokenRecord = updatedToken;
                activeUsage = 0;
            } else if (tokenRecord.usage_limit_cap !== expectedLimit) {
                // Tier mismatch caught (e.g. user just checked out or downgraded)! Instantly update capacity bounds
                const { data: updatedToken } = await supabaseAdmin
                    .from('ecoroute_corporate_api_tokens')
                    .update({ usage_limit_cap: expectedLimit, updated_at: new Date().toISOString() })
                    .eq('user_id', userId)
                    .select()
                    .single();

                tokenRecord = updatedToken;
                activeUsage = tokenRecord.current_monthly_usage || 0;
            } else {
                activeUsage = tokenRecord.current_monthly_usage || 0;
            }
        } else {
            // FIXED AUTO-INITIALIZATION PIPELINE: Create a secure channels token block if none exists yet
            const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            const { data: newToken, error: createError } = await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .insert({
                    user_id: userId,
                    organization_name: 'Independent Enterprise',
                    api_token: secureHexKey,
                    current_monthly_usage: 0,
                    usage_limit_cap: expectedLimit,
                    last_reset_period: activePeriodKey,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;

            // FIXED ACCESS BYPASS: Ensure a brand new profile immediately returns full validation access clearance
            return {
                allowed: true,
                currentUsage: 0,
                limitCap: expectedLimit,
                requestsRemaining: expectedLimit,
                tokenRecord: newToken
            };
        }

        return {
            // FIXED CHECK BOUNDS: Strictly evaluate bounds matching against current operational limit capacities
            allowed: activeUsage < expectedLimit,
            currentUsage: activeUsage,
            limitCap: expectedLimit,
            requestsRemaining: Math.max(0, expectedLimit - activeUsage),
            tokenRecord
        };

    } catch (err) {
        console.error('[Quota Invalidation Engine Fault]:', err.message);
        return { allowed: false, currentUsage: 0, limitCap: 100, requestsRemaining: 0, tokenRecord: null };
    }
}
