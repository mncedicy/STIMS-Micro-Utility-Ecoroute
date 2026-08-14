// src/app/api/v1/bulk-log/route.js

import { validateBatchPayload } from './validator';
import { processItemCalculation } from './calculator';
import { dispatchCorporateWebhook } from '../config/webhookDispatcher';
import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    sendApiResponse
} from '../config/apiConfig';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function POST(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: false });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { supabaseAdmin, tokenRecord, apiKeyToken, corsHeaders } = authValidation;

    try {
        let body;
        try { body = await req.json(); } catch {
            return sendApiResponse(req, { error: 'Bad Payload: Request body must be a valid JSON object.' }, corsHeaders, 400);
        }

        const validationRes = validateBatchPayload(body);
        if (validationRes.error) {
            return sendApiResponse(req, { error: validationRes.error }, corsHeaders, 400);
        }

        const { cost_center = 'Unassigned', batch_items = [] } = body;
        const currentUsage = tokenRecord.current_monthly_usage || 0;
        const usageCap = tokenRecord.usage_limit_cap || 100;

        if (currentUsage + batch_items.length > usageCap) {
            return sendApiResponse(req, {
                error: `Quota Exceeded: Bulk payload of ${batch_items.length} entries exceeds capacity.`
            }, corsHeaders, 429);
        }

        const successfulRowsCount = batch_items.length;
        const nextUsageValue = currentUsage + successfulRowsCount;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: nextUsageValue,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        const { data: existingLogs } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('batch_manifest_row_id')
            .eq('user_id', tokenRecord.user_id)
            .not('batch_manifest_row_id', 'is', null);

        const databaseRefIdsSet = new Set(existingLogs?.map(l => l.batch_manifest_row_id) || []);

        const dynamicLogsPayloads = [];
        const calculationResults = [];
        let batchAccruedTaxAccumulator = 0;
        let totalItemsSavedCount = 0;

        for (const item of batch_items) {
            const res = await processItemCalculation(item, cost_center, apiKeyToken);
            batchAccruedTaxAccumulator += res.rowAccruedTaxZar;

            const isDuplicate = databaseRefIdsSet.has(res.uniqueReferenceKey);
            const isActuallySaved = res.savedToLedger && !isDuplicate;

            if (isActuallySaved) {
                totalItemsSavedCount++;
            }

            calculationResults.push({
                reference_id: res.uniqueReferenceKey,
                type: res.cleanType,
                emission_date: res.resolvedDate,
                metrics: res.conversions,
                saved_to_ledger: res.savedToLedger,
                is_duplicate_override: isDuplicate && res.savedToLedger
            });

            if (res.ledgerPayload) {
                dynamicLogsPayloads.push({
                    user_id: tokenRecord.user_id,
                    ...res.ledgerPayload
                });
            }
        }

        if (dynamicLogsPayloads.length > 0) {
            const { error: batchInsertError } = await supabaseAdmin
                .from('ecoroute_emissions_logs')
                .upsert(dynamicLogsPayloads, { onConflict: 'user_id, batch_manifest_row_id' });

            if (batchInsertError) throw batchInsertError;
        }

        const baselineAccruedTaxZar = parseFloat(tokenRecord.total_accrued_tax_liability_zar || 0.00);
        const totalUpdatedTaxLiabilityZar = baselineAccruedTaxZar + batchAccruedTaxAccumulator;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                total_accrued_tax_liability_zar: totalUpdatedTaxLiabilityZar,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        // --- ASYNCHRONOUS CORPORATE WEBHOOK NOTIFICATION DISPATCH ENGINES ---
        try {
            // 1. Fire bulk batch job integration finished event callback
            await dispatchCorporateWebhook(tokenRecord.user_id, 'batch_audit_completed', {
                total_items_processed: successfulRowsCount,
                total_items_saved: totalItemsSavedCount,
                accrued_batch_tax_zar: parseFloat(batchAccruedTaxAccumulator.toFixed(2))
            });

            const updatedUsageRatio = nextUsageValue / usageCap;

            // 2. Quota Exhaustion Warning (95% tier boundary checkpoint limit check)
            if (updatedUsageRatio >= 0.95 && (currentUsage / usageCap) < 0.95) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: nextUsageValue,
                    quota_limit: usageCap
                });
            }

            // 3. Carbon Threshold Alert (85% sustainability profile checkpoint)
            const sustainabilityCapZar = 20000.00;
            if (totalUpdatedTaxLiabilityZar >= (sustainabilityCapZar * 0.85) && baselineAccruedTaxZar < (sustainabilityCapZar * 0.85)) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'carbon_threshold_alert', {
                    threshold_reached: '85%',
                    message: "Triggered immediately when aggregate corporate monthly carbon emissions cross 85% of your configured sustainability budget cap.",
                    accrued_tax_zar: parseFloat(totalUpdatedTaxLiabilityZar.toFixed(2)),
                    threshold_limit_zar: sustainabilityCapZar
                });
            }
        } catch (webhookHookErr) {
            console.warn('⚠️ [Bulk API Webhook Dispatch Bypass]: Flow execution skipped:', webhookHookErr.message);
        }

        return sendApiResponse(req, {
            success: true,
            total_items_processed: successfulRowsCount,
            total_items_saved: totalItemsSavedCount,
            quota_requests_remaining: Math.max(0, usageCap - nextUsageValue),
            results: calculationResults
        }, corsHeaders, 201);

    } catch (err) {
        console.error('🚨 [Bulk API Matrix Processing Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal bulk calculation disruption: ' + err.message }, corsHeaders, 500);
    }
}
