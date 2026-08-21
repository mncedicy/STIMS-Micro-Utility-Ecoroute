// src/app/api/estimates/pipelineService.js

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { dispatchCorporateWebhook } from '@/app/api/v1/config/webhookDispatcher';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function runEmissionsPipeline({ user, cleanType, body, conversionsPayload, metadataLog, appMetaRes, tokenQuery, profRes, currentUsageCount }) {
    const resolvedEmissionDate = body.emission_date && /^\d{4}-\d{2}-\d{2}$/.test(body.emission_date)
        ? body.emission_date
        : new Date().toISOString().split('T')[0];

    const sanitizedCostCenter = body.cost_center && body.cost_center.toString().trim() !== ''
        ? body.cost_center.toString().trim().substring(0, 100)
        : 'Unassigned';

    // FIXED: Appends captured OSRM road geometry metrics into your standard saved database log entry payload structures
    const finalMetadataBlock = {
        ...metadataLog,
        userAssignedDate: resolvedEmissionDate,
        costCenterAssigned: sanitizedCostCenter,
        totalDurationSeconds: body.osrm_total_duration || 0,
        tripLegsArray: body.osrm_legs_data || [],
        waypointsArray: body.osrm_waypoints_data || []
    };

    // 1. Write transactional log
    const { data: dbLogEntry, error: dbWriteError } = await supabaseAdmin
        .from('ecoroute_emissions_logs')
        .insert({
            user_id: user.id,
            vehicle_id: cleanType === 'vehicle' ? body.vehicle_id : null,
            category_display: body.type.toUpperCase(),
            carbon_kg: conversionsPayload.carbon_kg,
            carbon_g: conversionsPayload.carbon_g,
            carbon_mt: conversionsPayload.carbon_mt,
            carbon_lb: conversionsPayload.carbon_lb,
            input_distance: ['vehicle', 'shipping'].includes(cleanType) ? parseFloat(body.distance) : null,
            input_unit: ['vehicle', 'shipping'].includes(cleanType) ? body.unit : null,
            origin_iata: cleanType === 'flight' ? body.origin_iata?.substring(0, 3).toUpperCase() : null,
            dest_iata: cleanType === 'flight' ? body.dest_iata?.substring(0, 3).toUpperCase() : null,
            passengers_count: cleanType === 'flight' ? parseInt(body.passengers, 10) : null,
            cargo_weight: cleanType === 'shipping' ? parseFloat(body.cargo_weight) : null,
            mass_unit: cleanType === 'shipping' ? body.mass_unit : null,
            energy_kwh: cleanType === 'electricity' ? parseFloat(body.kwh) : null,
            country_code: cleanType === 'electricity' ? body.country_code?.toUpperCase() : null,
            gas_quantity: cleanType === 'gas' ? parseFloat(body.quantity) : null,
            gas_type: body.gas_type || 'NATURAL_GAS',
            gas_unit: body.gas_unit || 'm3',
            emission_date: resolvedEmissionDate,
            cost_center: sanitizedCostCenter,
            raw_payload: {
                ...conversionsPayload,
                metadata: finalMetadataBlock,
                global_flight_route: cleanType === 'flight' ? { origin_name_full: body.origin_iata, destination_name_full: body.dest_iata } : null
            }
        })
        .select()
        .single();

    if (dbWriteError) throw new Error(`Database policy restriction: ${dbWriteError.message}`);

    // 2. Compute Tax Ledger Accruals
    const taxRatePerTon = parseFloat(appMetaRes.data?.carbon_tax_rate_zar_per_tonne || 190.00);
    const freeAllowancePercent = parseFloat(appMetaRes.data?.carbon_tax_free_allowance_percentage || 60.00);
    const incrementalTonnes = parseFloat(conversionsPayload.carbon_mt || 0);
    const taxableTonnesFactor = incrementalTonnes * (1 - (freeAllowancePercent / 100));
    const incrementalTaxLiabilityZar = taxableTonnesFactor * taxRatePerTon;

    const baselineAccruedTaxZar = parseFloat(tokenQuery.data?.total_accrued_tax_liability_zar || 0.00);
    const nextUpdatedTaxLiabilityTotalZar = baselineAccruedTaxZar + incrementalTaxLiabilityZar;
    const nextUsageCountValue = currentUsageCount + 1;

    const resolvedEnterpriseName = profRes.data?.company?.trim() || `${profRes.data?.first_name || 'Independent'} ${profRes.data?.surname || 'Enterprise'}`.trim();
    const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: updatedTokenRecord } = await supabaseAdmin
        .from('ecoroute_corporate_api_tokens')
        .upsert({
            id: tokenQuery.data?.id || undefined,
            user_id: user.id,
            organization_name: resolvedEnterpriseName,
            api_token: tokenQuery.data?.api_token || secureHexKey,
            current_monthly_usage: nextUsageCountValue,
            usage_limit_cap: tokenQuery.data?.usage_limit_cap || 100,
            total_accrued_tax_liability_zar: nextUpdatedTaxLiabilityTotalZar,
            last_reset_period: tokenQuery.data?.last_reset_period || new Date().toISOString().split('T')[0],
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

    // 3. Dispatch Notification Webhooks
    try {
        const usageCap = updatedTokenRecord?.usage_limit_cap || 100;
        if ((nextUsageCountValue / usageCap) >= 0.95 && (currentUsageCount / usageCap) < 0.95) {
            await dispatchCorporateWebhook(user.id, 'quota_exhaustion_warning', { threshold_reached: '95%', current_usage: nextUsageCountValue, quota_limit: usageCap });
        }
        if (nextUpdatedTaxLiabilityTotalZar >= 17000.00 && baselineAccruedTaxZar < 17000.00) {
            await dispatchCorporateWebhook(user.id, 'carbon_threshold_alert', { threshold_reached: '85%', accrued_tax_zar: parseFloat(nextUpdatedTaxLiabilityTotalZar.toFixed(2)), threshold_limit_zar: 20000.00 });
        }
        await dispatchCorporateWebhook(user.id, 'audit.saved', { log_record_id: dbLogEntry.id, category: cleanType.toUpperCase(), carbon_kg: conversionsPayload.carbon_kg, cost_center: sanitizedCostCenter, emission_date: resolvedEmissionDate });
    } catch (e) {
        console.warn('⚠️ Webhook bypassed:', e.message);
    }

    try {
        revalidatePath('/');
        revalidatePath('/dashboard');
    } catch { }

    return { ...dbLogEntry, tokenRecord: updatedTokenRecord };
}
