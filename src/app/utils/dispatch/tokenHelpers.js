// src/app/utils/dispatch/tokenHelpers.js

import { supabase } from '../../lib/supabaseClient';
import { dispatchCorporateWebhook } from '@/app/api/v1/config/webhookDispatcher';

/**
 * Fetches the corporate API token record for a given user ID
 */
export async function getTokenRecord(user_id) {
    const { data: tokenRecord, error: tokenError } = await supabase
        .from('ecoroute_corporate_api_tokens')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

    if (tokenError) {
        throw tokenError;
    }

    return tokenRecord;
}

/**
 * Checks if additional request usage will exceed the configured usage_limit_cap,
 * updates usage count if within limits, and triggers quota exhaustion warnings on success.
 */
export async function updateUsage(user_id, increment_value = 1) {
    const tokenRecord = await getTokenRecord(user_id);

    if (!tokenRecord) {
        return {
            exceeded: true,
            message: 'Token record not found for the specified user_id.',
            value: 0,
            usage_limit_cap: 0,
            remaining: 0
        };
    }

    const currentUsage = tokenRecord.current_monthly_usage || 0;
    const usageCap = tokenRecord.usage_limit_cap || 100;
    const projectedUsage = currentUsage + increment_value;
    const exceeded = projectedUsage > usageCap;

    if (!exceeded) {
        const updatedUsage = currentUsage + increment_value;

        const { error: updateError } = await supabase
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: updatedUsage,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        if (updateError) {
            return {
                exceeded: true,
                message: updateError.message || 'Error updating usage count.',
                value: 0,
                usage_limit_cap: 0,
                remaining: 0
            };
        }

        // Quota exhaustion warning trigger (executes only on successful update)
        try {
            const updatedUsageRatio = updatedUsage / usageCap;
            const previousUsageRatio = currentUsage / usageCap;

            if (updatedUsageRatio >= 0.95 && previousUsageRatio < 0.95) {
                await dispatchCorporateWebhook(user_id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: updatedUsage,
                    quota_limit: usageCap
                });
            }
        } catch (webhookErr) {
            console.warn('⚠️ [Quota Warning Webhook Dispatch Bypass]: Flow execution skipped:', webhookErr.message);
        }

        return {
            exceeded: false,
            message: "Usage limit check passed and usage count updated successfully.",
            value: updatedUsage,
            usage_limit_cap: usageCap,
            remaining: Math.max(0, usageCap - updatedUsage)
        };
    }

    return {
        exceeded,
        message: `Usage limit exceeded: Projected usage (${projectedUsage}) exceeds monthly cap (${usageCap}).`,
        value: projectedUsage,
        usage_limit_cap: usageCap,
        remaining: Math.max(0, usageCap - projectedUsage)
    };
}