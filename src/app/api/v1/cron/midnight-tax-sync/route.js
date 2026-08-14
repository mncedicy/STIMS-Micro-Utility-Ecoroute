// src/app/api/v1/cron/webhook-trigger/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchCorporateWebhook } from '../../config/webhookDispatcher';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req) {
    // Secure authorization header verification for Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized cron request execution.' }, { status: 401 });
    }

    try {
        console.log('🌙 [Midnight Cron Execution]: Starting daily billing period and usage reset evaluation...');

        const currentIsoDate = new Date().toISOString().split('T')[0];
        const currentDayOfMonth = new Date().getDate();

        // Run only on the 1st of every month to reset monthly usage metrics
        if (currentDayOfMonth === 1) {
            const { data: tokensToReset, error: fetchError } = await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .select('*')
                .eq('is_active', true);

            if (fetchError) throw fetchError;

            let resetCount = 0;

            if (tokensToReset && tokensToReset.length > 0) {
                for (const tokenRecord of tokensToReset) {
                    // Archive previous month usage or reset counters directly
                    await supabaseAdmin
                        .from('ecoroute_corporate_api_tokens')
                        .update({
                            current_monthly_usage: 0,
                            last_reset_period: currentIsoDate,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', tokenRecord.id);

                    // Dispatch midnight monthly reset confirmation event hook
                    try {
                        await dispatchCorporateWebhook(tokenRecord.user_id, 'automated_monthly_reset', {
                            reset_date: currentIsoDate,
                            previous_usage_cleared: tokenRecord.current_monthly_usage || 0,
                            quota_limit: tokenRecord.usage_limit_cap || 100,
                            message: "Your corporate monthly request volume has been successfully reset for the new billing cycle."
                        });
                    } catch (webhookErr) {
                        console.warn(`⚠️ [Cron Webhook Fail for User ${tokenRecord.user_id}]:`, webhookErr.message);
                    }

                    resetCount++;
                }
            }

            console.log(`✅ [Midnight Cron Success]: Reset monthly quotas for ${resetCount} corporate accounts.`);
            return NextResponse.json({
                success: true,
                action: 'MONTHLY_QUOTA_RESET_COMPLETED',
                accounts_processed: resetCount,
                timestamp: new Date().toISOString()
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            action: 'NO_ACTION_REQUIRED_MID_MONTH',
            message: 'Cron triggered successfully. Monthly quota resets occur exclusively on the 1st day of each month.',
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (err) {
        console.error('🚨 [Midnight Cron Execution Failure]:', err.message);
        return NextResponse.json({ error: 'Internal cron processing error: ' + err.message }, { status: 500 });
    }
}
