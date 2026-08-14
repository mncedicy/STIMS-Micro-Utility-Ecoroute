// /src/app/api/estimates/route.js
import { NextResponse } from 'next/server';
import { getEstimatesSupabaseClient } from '../estimates/supabaseClient';
import { processCategoryEmissions } from './categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { dispatchCorporateWebhook } from '../config/webhookDispatcher';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

        const supabase = await getEstimatesSupabaseClient(bearerToken);
        let { data: { user }, error: authError } = await supabase.auth.getUser();

        if ((authError || !user) && bearerToken) {
            try {
                const { data: fallbackAuth, error: fallbackError } = await supabase.auth.getUser(bearerToken);
                if (!fallbackError && fallbackAuth?.user) {
                    user = fallbackAuth.user;
                    authError = null;
                }
            } catch (fallbackCatchError) {
                console.error('[API Auth Fallback Exception]:', fallbackCatchError.message);
            }
        }

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized user access' }, { status: 401 });
        }

        // Fetch token records, applications parameters, and subscription data concurrently
        const [appMetaRes, subRes, tokenQuery, profRes] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('user_subscriptions').select('tier, status').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle(),
            supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle()
        ]);

        const currentUsageCount = tokenQuery.data?.current_monthly_usage || 0;
        const capacityLimitBounds = tokenQuery.data?.usage_limit_cap || 100;

        if (currentUsageCount >= capacityLimitBounds) {
            return NextResponse.json({
                error: `Quota Blocked: Monthly request volume exhausted. Current limit: ${currentUsageCount}/${capacityLimitBounds} requests.`
            }, { status: 429 });
        }

        const body = await req.json();
        if (!body.type) {
            return NextResponse.json({ error: 'Calculation category parameter type is required' }, { status: 400 });
        }

        const cleanType = body.type.toLowerCase();
        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, body, bearerToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const resolvedEmissionDate = body.emission_date && /^\d{4}-\d{2}-\d{2}$/.test(body.emission_date)
            ? body.emission_date
            : new Date().toISOString().split('T');

        // FIXED BRANCH RESOLUTION: Sanitize incoming custom cost center name input tags cleanly
        const sanitizedCostCenter = body.cost_center && body.cost_center.toString().trim() !== ''
            ? body.cost_center.toString().trim().substring(0, 100)
            : 'Unassigned';

        // 2. Persist emissions calculation log
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
                cost_center: sanitizedCostCenter, // FIXED: Dynamic multi-branch parameter mapped natively
                raw_payload: {
                    ...conversionsPayload,
                    metadata: {
                        ...metadataLog,
                        userAssignedDate: resolvedEmissionDate,
                        costCenterAssigned: sanitizedCostCenter
                    },
                    global_flight_route: cleanType === 'flight' ? {
                        origin_name_full: body.origin_iata,
                        destination_name_full: body.dest_iata
                    } : null
                }
            })
            .select()
            .single();

        if (dbWriteError) {
            return NextResponse.json({ error: `Database policy restriction: ${dbWriteError.message}` }, { status: 500 });
        }

        // FINANCIAL TAX LIABILITY ENGINE: Calculates real-time tax cost exposures natively
        const taxRatePerTon = parseFloat(appMetaRes.data?.carbon_tax_rate_zar_per_tonne || 190.00);
        const freeAllowancePercent = parseFloat(appMetaRes.data?.carbon_tax_free_allowance_percentage || 60.00);

        const incrementalTonnes = parseFloat(conversionsPayload.carbon_mt || (calculatedKg / 1000));
        const taxableTonnesFactor = incrementalTonnes * (1 - (freeAllowancePercent / 100));
        const incrementalTaxLiabilityZar = taxableTonnesFactor * taxRatePerTon;

        const baselineAccruedTaxZar = parseFloat(tokenQuery.data?.total_accrued_tax_liability_zar || 0.00);
        const nextUpdatedTaxLiabilityTotalZar = baselineAccruedTaxZar + incrementalTaxLiabilityZar;

        const nextUsageCountValue = currentUsageCount + 1;
        const currentPeriodKey = tokenQuery.data?.last_reset_period || new Date().toISOString().split('T')[0];

        const resolvedEnterpriseName = profRes.data?.company?.trim()
            ? profRes.data.company.trim()
            : `${profRes.data?.first_name || 'Independent'} ${profRes.data?.surname || 'Enterprise'}`.trim();

        const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const { data: updatedTokenRecord } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .upsert({
                id: tokenQuery.data?.id || undefined,
                user_id: user.id,
                organization_name: resolvedEnterpriseName,
                api_token: tokenQuery.data?.api_token || secureHexKey,
                current_monthly_usage: nextUsageCountValue,
                usage_limit_cap: tokenQuery.data?.usage_limit_cap || (subRes.data?.tier === 'premium' ? 3000 : 100),
                total_accrued_tax_liability_zar: nextUpdatedTaxLiabilityTotalZar,
                last_reset_period: currentPeriodKey,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        // --- ASYNCHRONOUS CORPORATE WEBHOOK NOTIFICATION DISPATCH ENGINES ---
        try {
            const usageCap = updatedTokenRecord?.usage_limit_cap || 100;
            const updatedUsageRatio = nextUsageCountValue / usageCap;

            // 1. Quota Exhaustion Warning webhook trigger (fires immediately at 95% usage limits)
            if (updatedUsageRatio >= 0.95 && (currentUsageCount / usageCap) < 0.95) {
                await dispatchCorporateWebhook(user.id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: nextUsageCountValue,
                    quota_limit: usageCap
                });
            }

            // 2. Carbon Threshold Alert webhook trigger (fires immediately at 85% of standard budget cap limit)
            const sustainabilityBudgetCapZar = 20000.00; // Custom corporate alert target checkpoint
            if (nextUpdatedTaxLiabilityTotalZar >= (sustainabilityBudgetCapZar * 0.85) && baselineAccruedTaxZar < (sustainabilityBudgetCapZar * 0.85)) {
                await dispatchCorporateWebhook(user.id, 'carbon_threshold_alert', {
                    threshold_reached: '85%',
                    message: "Triggered immediately when aggregate corporate monthly carbon emissions cross 85% of your configured sustainability budget cap.",
                    accrued_tax_zar: parseFloat(nextUpdatedTaxLiabilityTotalZar.toFixed(2)),
                    threshold_limit_zar: sustainabilityBudgetCapZar
                });
            }

            // 3. Single Item Audit Calculation Saved callback event trigger
            await dispatchCorporateWebhook(user.id, 'audit.saved', {
                log_record_id: dbLogEntry.id,
                category: cleanType.toUpperCase(),
                carbon_kg: conversionsPayload.carbon_kg,
                cost_center: sanitizedCostCenter,
                emission_date: resolvedEmissionDate
            });

        } catch (webhookHookErr) {
            console.warn('⚠️ [Webhook Dispatch Bypass]: Background pipeline delivery paused. Exception:', webhookHookErr.message);
        }

        try {
            revalidatePath('/');
            revalidatePath('/dashboard');
        } catch (cacheErr) {
            console.warn('[Cache Revalidation Bypass]:', cacheErr.message);
        }

        const responseData = {
            ...dbLogEntry,
            tokenRecord: updatedTokenRecord
        };

        return NextResponse.json({ success: true, data: responseData }, { status: 200 });

    } catch (error) {
        console.error("🚨 EcoRoute API Orchestrator Crash:", error.message);
        return NextResponse.json({ error: error.message || "Internal server computation failure." }, { status: 500 });
    }
}
