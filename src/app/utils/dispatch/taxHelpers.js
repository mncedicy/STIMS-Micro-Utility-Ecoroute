// src/app/utils/dispatch/taxHelpers.js

import { supabase } from '../../lib/supabaseClient';
import { updateUsage, getTokenRecord } from './tokenHelpers';
import { dispatchCorporateWebhook } from '@/app/api/v1/config/webhookDispatcher';
import {
    CARBON_TAX_BASE_RATE_ZAR,
    STANDARD_FREE_ALLOWANCE_EXEMPTION
} from '../../api/v1/config/apiConfig';

/**
 * Calculates carbon tax liability, tracks API request usage, dispatches webhook, and builds structured response.
 */
export async function calculateTax(user_id, startDate, endDate) {
    try {
        // 1. Increment and validate usage quota
        const usageResult = await updateUsage(user_id, 1);
        if (usageResult.exceeded) {
            return { error: usageResult.message, status: 429 };
        }

        // 2. Fetch organization token details
        const tokenRecord = await getTokenRecord(user_id);

        // 3. Query emissions logs for date range
        let query = supabase
            .from('ecoroute_emissions_logs')
            .select('carbon_kg, carbon_mt, emission_date')
            .eq('user_id', user_id);

        if (startDate) query = query.gte('emission_date', startDate);
        if (endDate) query = query.lte('emission_date', endDate);

        const { data: logs, error: logsError } = await query;
        if (logsError) throw logsError;

        let aggregatedMassKg = 0;
        let aggregatedMassMt = 0;

        if (logs && logs.length > 0) {
            logs.forEach((log) => {
                const kg = parseFloat(log.carbon_kg || 0);
                aggregatedMassKg += kg;
                aggregatedMassMt += log.carbon_mt ? parseFloat(log.carbon_mt) : kg / 1000;
            });
        }

        const taxableMetricTonnes = aggregatedMassMt * (1 - STANDARD_FREE_ALLOWANCE_EXEMPTION);
        const overallCalculatedTaxLiabilityZar = taxableMetricTonnes * CARBON_TAX_BASE_RATE_ZAR;

        const responsePayload = {
            success: true,
            organization: tokenRecord?.organization_name || 'Fleet Corporate User',
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
            quota_requests_remaining: usageResult.remaining
        };

        // 4. Dispatch corporate webhook
        try {
            await dispatchCorporateWebhook(user_id, 'tax_liability_updated', {
                calculation_period_close: new Date().toISOString().split('T')[0],
                filter_window: {
                    start: startDate || 'unbounded',
                    end: endDate || 'unbounded'
                },
                total_records_compiled: logs?.length || 0,
                accrued_tax_liability_zar: parseFloat(overallCalculatedTaxLiabilityZar.toFixed(2)),
                total_volume_mt: parseFloat(aggregatedMassMt.toFixed(4))
            });
        } catch (webhookErr) {
            console.warn('⚠️ [Tax Report Webhook Dispatch Bypass]: Flow execution skipped:', webhookErr.message);
        }

        return {
            responsePayload,
            status: 200
        };
    } catch (err) {
        return {
            error: err.message || 'Internal server carbon tax evaluation failure.',
            status: 500
        };
    }
}