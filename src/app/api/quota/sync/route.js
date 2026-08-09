// /src/app/api/quota/sync/route.js
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

    const monthsElapsed = (today.getFullYear() - anchorDate.getFullYear()) * 12 + (today.getMonth() - anchorDate.getMonth());
    if (monthsElapsed <= 0) return false;

    const targetResetDay = new Date(today.getFullYear(), today.getMonth(), anchorDate.getDate());

    // FIXED DATE FORMAT: Evaluates clean YYYY-MM-DD ISO compliant strings to prevent DB type exceptions
    const activeCycleAnchor = today >= targetResetDay
        ? today.toISOString().split('T')[0]
        : new Date(today.getFullYear(), today.getMonth() - 1, anchorDate.getDate()).toISOString().split('T')[0];

    return activeCycleAnchor;
}

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        if (!authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized session.' }, { status: 401 });
        }
        const bearerToken = authHeader.substring(7).trim();

        // Initialize user-scoped validation client safely
        const { data: { user }, error: authError } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        ).auth.getUser(bearerToken);

        if (authError || !user) {
            return Response.json({ error: 'Unauthorized user access' }, { status: 401 });
        }

        // 1. Fetch tables concurrently (API tokens work independently of subscriptions)
        let [prof, subRes, tokenRes, userRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabaseAdmin.from('user_subscriptions').select('tier, status, current_period_start').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(user.id)
        ]);

        const isPremium = subRes.data?.tier === 'premium' && subRes.data?.status === 'active';
        const expectedLimit = isPremium ? 3000 : 100;

        // Define anchor reference point: Premium uses billing cycle, Free uses signup date
        const cycleAnchorDate = isPremium
            ? subRes.data?.current_period_start
            : (userRes.data?.user?.created_at || new Date().toISOString());

        // FIXED DATE ASSIGNMENT: Evaluates strict YYYY-MM-DD formatting matching default parameters rules
        const activePeriodKey = checkPeriodResetAnchor(cycleAnchorDate) || new Date(cycleAnchorDate).toISOString().split('T')[0];

        let activeUsage = tokenRes.data ? (tokenRes.data.current_monthly_usage || 0) : 0;
        let tokenRecord = tokenRes.data;

        // FIXED COMPANY RESOLUTION: Dynamically grabs profile company name from ecoroute public.profiles table records
        const resolvedEnterpriseName = prof.data?.company?.trim()
            ? prof.data.company.trim()
            : `${prof.data?.first_name || 'Independent'} ${prof.data?.surname || 'Enterprise'}`.trim();

        if (tokenRecord) {
            // Check if active monthly anniversary date key has moved forward
            if (tokenRecord.last_reset_period !== activePeriodKey) {
                const { data: updatedToken } = await supabaseAdmin
                    .from('ecoroute_corporate_api_tokens')
                    .update({
                        current_monthly_usage: 0,
                        usage_limit_cap: expectedLimit,
                        last_reset_period: activePeriodKey,
                        organization_name: resolvedEnterpriseName,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)
                    .select().single();

                tokenRecord = updatedToken;
                activeUsage = 0;
            } else if (tokenRecord.usage_limit_cap !== expectedLimit || tokenRecord.organization_name !== resolvedEnterpriseName) {
                // Tier status or company profile update sync check
                const { data: updatedToken } = await supabaseAdmin
                    .from('ecoroute_corporate_api_tokens')
                    .update({
                        usage_limit_cap: expectedLimit,
                        organization_name: resolvedEnterpriseName,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id).select().single();

                tokenRecord = updatedToken;
                activeUsage = tokenRecord.current_monthly_usage || 0;
            } else {
                activeUsage = tokenRecord.current_monthly_usage || 0;
            }
        } else {
            // 2. AUTO-CREATION: Token is generated instantly for Free/Premium accounts alike
            const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');

            const { data: newToken } = await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .insert({
                    user_id: user.id,
                    organization_name: resolvedEnterpriseName, // FIXED: Injected database corporate profile string
                    api_token: secureHexKey,
                    current_monthly_usage: 0,
                    usage_limit_cap: expectedLimit,
                    last_reset_period: activePeriodKey, // FIXED: Strict string format (YYYY-MM-DD)
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .select().single();

            tokenRecord = newToken;
            activeUsage = 0;
        }

        return Response.json({
            success: true,
            allowed: activeUsage < expectedLimit,
            currentUsage: activeUsage,
            limitCap: expectedLimit,
            tokenRecord
        }, { status: 200 });

    } catch (err) {
        console.error('[Secure Quota Edge Tunnel Error]:', err.message);
        return Response.json({ error: 'Internal pipeline synchronisation failure.' }, { status: 500 });
    }
}
