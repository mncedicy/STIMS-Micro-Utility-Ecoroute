// src/app/api/v1/tax-report/route.js

import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    getCachedResponse,
    setCachedResponse,
    sendApiResponse,
    CARBON_TAX_BASE_RATE_ZAR,
    STANDARD_FREE_ALLOWANCE_EXEMPTION
} from '../config/apiConfig';
import { dispatchCorporateWebhook } from '../config/webhookDispatcher';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function GET(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: true });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { supabaseAdmin, tokenRecord, corsHeaders } = authValidation;

    try {
        const currentUsage = tokenRecord.current_monthly_usage || 0;
        const usageCap = tokenRecord.usage_limit_cap || 100;
        const nextUsageValue = currentUsage + 1;

        // Increment usage immediately even if cached
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: nextUsageValue,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        const requestUrl = req.url;
        const cachedData = getCachedResponse(requestUrl);
        if (cachedData) {
            corsHeaders['X-Cache'] = 'HIT';
            cachedData.quota_requests_remaining = Math.max(0, usageCap - nextUsageValue);
            return sendApiResponse(req, cachedData, corsHeaders, 200);
        }

        const { searchParams } = new URL(requestUrl);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        let query = supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('carbon_kg, carbon_mt, emission_date')
            .eq('user_id', tokenRecord.user_id);

        if (startDate) query = query.gte('emission_date', startDate);
        if (endDate) query = query.lte('emission_date', endDate);

        const { data: logs, error: logsError } = await query;
        if (logsError) throw logsError;

        let aggregatedMassKg = 0;
        let aggregatedMassMt = 0;

        if (logs && logs.length > 0) {
            logs.forEach(log => {
                const kg = parseFloat(log.carbon_kg || 0);
                aggregatedMassKg += kg;
                aggregatedMassMt += log.carbon_mt ? parseFloat(log.carbon_mt) : (kg / 1000);
            });
        }

        const taxableMetricTonnes = aggregatedMassMt * (1 - STANDARD_FREE_ALLOWANCE_EXEMPTION);
        const overallCalculatedTaxLiabilityZar = taxableMetricTonnes * CARBON_TAX_BASE_RATE_ZAR;

        const responsePayload = {
            success: true,
            organization: tokenRecord.organization_name,
            filter_applied: {
                start_date: startDate || 'unbounded_start',
                end_date: endDate || 'unbounded_end'
            },
            total_records_analyzed: logs?.length || 0,
            summary_metrics: {
                total_emissions_co2_kg: parseFloat(aggregatedMassKg.toFixed(2)),
                total_emissions_co2_mt: parseFloat(aggregatedMassMt.toFixed(4))
            },
            sars_tax_compliance_ledger: {
                statutory_base_rate_zar_per_tonne: CARBON_TAX_BASE_RATE_ZAR,
                free_basic_allowance_exemption_percentage: `${STANDARD_FREE_ALLOWANCE_EXEMPTION * 100}%`,
                taxable_emissions_volume_mt: parseFloat(taxableMetricTonnes.toFixed(4)),
                total_accrued_liability_zar: parseFloat(overallCalculatedTaxLiabilityZar.toFixed(2))
            },
            quota_requests_remaining: Math.max(0, usageCap - nextUsageValue)
        };

        // --- INTEGRATED LIVE WEBHOOK DISPATCH TRIGGER ---
        try {
            await dispatchCorporateWebhook(tokenRecord.user_id, 'tax_liability_updated', {
                calculation_period_close: new Date().toISOString().split('T')[0],
                filter_window: {
                    start: startDate || 'unbounded',
                    end: endDate || 'unbounded'
                },
                total_records_compiled: logs?.length || 0,
                accrued_tax_liability_zar: parseFloat(overallCalculatedTaxLiabilityZar.toFixed(2)),
                total_volume_mt: parseFloat(aggregatedMassMt.toFixed(4))
            });

            // Trigger quota warning webhook check if consumption has reached a critical threshold
            const updatedUsageRatio = nextUsageValue / usageCap;
            if (updatedUsageRatio >= 0.95 && (currentUsage / usageCap) < 0.95) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: nextUsageValue,
                    quota_limit: usageCap
                });
            }
        } catch (webhookErr) {
            console.warn('⚠️ [Tax Report Webhook Dispatch Bypass]: Flow execution skipped:', webhookErr.message);
        }

        setCachedResponse(requestUrl, responsePayload);
        corsHeaders['X-Cache'] = 'MISS';

        return sendApiResponse(req, responsePayload, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [SARS Tax API Engine Crash]:', err.message);
        return sendApiResponse(req, { error: 'Internal server carbon tax evaluation failure: ' + err.message }, corsHeaders, 500);
    }
}
