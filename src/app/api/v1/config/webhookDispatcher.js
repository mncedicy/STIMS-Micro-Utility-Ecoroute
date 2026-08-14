// src/app/api/v1/config/webhookDispatcher.js

import { createClient } from '@supabase/supabase-js';

/**
 * Dispatches a cryptographic real-time event notification back to a corporate client's endpoint.
 * Bypasses network blocks using non-blocking background fetch runs.
 */
export async function dispatchCorporateWebhook(userId, eventType, innerPayload) {
    if (!userId) return false;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        // 1. Resolve active listener destination string properties from token record
        const { data: tokenRecord, error: dbError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('webhook_destination_url, organization_name, current_monthly_usage, usage_limit_cap')
            .eq('user_id', userId)
            .maybeSingle();

        if (dbError || !tokenRecord || !tokenRecord.webhook_destination_url) {
            return false; // Safely exit if no URL is active or configured
        }

        const targetDestination = tokenRecord.webhook_destination_url.trim();
        if (!targetDestination.startsWith('http')) return false;

        // 2. Assemble unified standard webhook structural data envelope wrapper
        const dynamicWebhookEnvelope = {
            event: eventType,
            organization: tokenRecord.organization_name,
            timestamp: new Date().toISOString(),
            payload: {
                ...innerPayload,
                meta: {
                    client_usage_current: tokenRecord.current_monthly_usage,
                    client_usage_capacity: tokenRecord.usage_limit_cap
                }
            }
        };

        // 3. Fire out background event dispatch asynchronously using standard AbortController triggers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second connection timeout guard

        fetch(targetDestination, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'EcoRoute-Engine-Webhook-Broker/v1.0',
                'X-EcoRoute-Event': eventType
            },
            body: JSON.stringify(dynamicWebhookEnvelope),
            signal: controller.signal
        })
            .then(async (res) => {
                clearTimeout(timeoutId);
                console.log(`📡 [Webhook Broker Success]: Transmitted ${eventType} to ${targetDestination} (Status: ${res.status})`);
            })
            .catch((fetchErr) => {
                clearTimeout(timeoutId);
                console.warn(`🚨 [Webhook Broker Network Fault]: ${eventType} delivery failed. Error:`, fetchErr.message);
            });

        return true;
    } catch (err) {
        console.error('🚨 [Webhook Dispatch System Failure]:', err.message);
        return false;
    }
}
