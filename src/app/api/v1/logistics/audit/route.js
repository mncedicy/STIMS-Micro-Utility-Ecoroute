// /src/app/api/v1/logistics/audit/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processCategoryEmissions } from '../../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { sanitizeCountryCode } from '../../import-csv/parameterGuard';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
    try {
        // 1. Authenticate Request via Bearer Authorization Header
        const authHeader = req.headers.get('authorization') || '';
        if (!authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                error: 'Missing or malformed Authorization header. Use format: Bearer ecoroute_live_...'
            }, { status: 401 });
        }

        const extractedApiToken = authHeader.substring(7).trim();

        // Query token allocation record natively to find matching corporate tenant profile node
        const { data: tokenRecord, error: tokenError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('api_token', extractedApiToken)
            .eq('is_active', true)
            .maybeSingle();

        if (tokenError || !tokenRecord) {
            return NextResponse.json({
                error: 'Invalid or deactivated programmatic bearer authentication token.'
            }, { status: 401 });
        }

        // 2. Enforce Volumetric Multitenant Quota Limits Caps
        const currentUsage = tokenRecord.current_monthly_usage || 0;
        const limitCapacityCap = tokenRecord.usage_limit_cap || 100;

        if (currentUsage >= limitCapacityCap) {
            return NextResponse.json({
                error: `Volumetric Quota Reached: Monthly programmatic capacity exhausted (${currentUsage}/${limitCapacityCap}). Upgrade your licensing contract plane.`
            }, { status: 429 });
        }

        // 3. Ingest and Parse JSON Payload Fields
        const body = await req.json();
        const type = body.type || body.category;

        if (!type) {
            return NextResponse.json({
                error: 'Mandatory tracking payload property key "type" (or "category") is missing.'
            }, { status: 400 });
        }

        const cleanType = type.toLowerCase().trim();

        // Dynamic configuration toggle parameter allowing dry-run test loops with zero log persistence
        const isDryRunOptionActive = body.dry_run === true || req.headers.get('x-dry-run') === 'true';

        // 4. Sanitize Input Parameter Formats Defensively
        const countryToken = sanitizeCountryCode(body.country || body.country_code);

        const computationForm = {
            type: cleanType,
            distance: body.distance || '0',
            unit: body.unit || 'km',
            vehicle_id: body.vehicle_id || null,
            origin_iata: body.origin || body.origin_iata || null,
            dest_iata: body.destination || body.dest_iata || null,
            passengers: body.passengers || '1',
            cargo_weight: body.cargo_weight || '0',
            mass_unit: body.mass_unit || 'kg',
            kwh: body.kwh || '0',
            country_code: countryToken,
            quantity: body.quantity || '0',
            gas_type: body.gas_type || 'NATURAL_GAS',
            gas_unit: body.gas_unit || 'm3'
        };

        // 5. Execute Greenhouse Gas Core Emissions Pipeline Formula Matrix Calculations
        // Generate dummy bearer anchor fallback reference token if calculating via internal sub-app contexts
        const authUserToken = extractedApiToken;
        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, computationForm, authUserToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const resolvedEmissionDate = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
            ? body.date
            : new Date().toISOString().split('T')[0];

        // 6. Abort Persistence Step Safely if Dry-Run Testing Toggles are Passed
        if (isDryRunOptionActive) {
            return NextResponse.json({
                success: true,
                dry_run: true,
                message: "Programmatic calculation successful. Record omitted from database logs history trail per dry-run parameters execution rules.",
                data: {
                    type: cleanType.toUpperCase(),
                    emission_date: resolvedEmissionDate,
                    ...conversionsPayload,
                    calculation_metadata: metadataLog
                }
            }, { status: 200 });
        }

        // 7. Persist Valid Ingestion Audit Row
        const { data: dbLogEntry, error: dbWriteError } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .insert({
                user_id: tokenRecord.user_id,
                vehicle_id: cleanType === 'vehicle' ? computationForm.vehicle_id : null,
                category_display: cleanType.toUpperCase(),
                carbon_kg: conversionsPayload.carbon_kg,
                carbon_g: conversionsPayload.carbon_g,
                carbon_mt: conversionsPayload.carbon_mt,
                carbon_lb: conversionsPayload.carbon_lb,
                input_distance: ['vehicle', 'shipping'].includes(cleanType) ? parseFloat(computationForm.distance) : null,
                input_unit: ['vehicle', 'shipping'].includes(cleanType) ? computationForm.unit : null,
                origin_iata: cleanType === 'flight' ? computationForm.origin_iata?.substring(0, 3).toUpperCase() : null,
                dest_iata: cleanType === 'flight' ? computationForm.dest_iata?.substring(0, 3).toUpperCase() : null,
                passengers_count: cleanType === 'flight' ? parseInt(computationForm.passengers, 10) : null,
                cargo_weight: cleanType === 'shipping' ? parseFloat(computationForm.cargo_weight) : null,
                mass_unit: cleanType === 'shipping' ? computationForm.mass_unit : null,
                energy_kwh: cleanType === 'electricity' ? parseFloat(computationForm.kwh) : null,
                country_code: countryToken,
                gas_quantity: cleanType === 'gas' ? parseFloat(computationForm.quantity) : null,
                gas_type: cleanType === 'gas' ? computationForm.gas_type : null,
                gas_unit: cleanType === 'gas' ? computationForm.gas_unit : null,
                emission_date: resolvedEmissionDate,
                log_source_channel: 'PROGRAMMATIC_B2B_API',
                batch_manifest_row_id: body.reference_id || body.manifest_id || `api_dispatch_${Date.now()}`,
                raw_payload: { ...conversionsPayload, metadata: metadataLog }
            })
            .select()
            .single();

        if (dbWriteError) {
            return NextResponse.json({ error: `Database write operation rejected: ${dbWriteError.message}` }, { status: 500 });
        }

        // 8. Update Multi-Region Carbon Tax Financial Accruals & Atomically Advance Usage Quota
        const { data: appMetaRes } = await supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle();
        const taxRatePerTon = parseFloat(appMetaRes?.carbon_tax_rate_zar_per_tonne || 190.00);
        const freeAllowancePercent = parseFloat(appMetaRes?.carbon_tax_free_allowance_percentage || 60.00);

        const incrementalTonnes = parseFloat(conversionsPayload.carbon_mt || (calculatedKg / 1000));
        const taxableTonnesFactor = incrementalTonnes * (1 - (freeAllowancePercent / 100));
        const incrementalTaxLiability = taxableTonnesFactor * taxRatePerTon;

        const nextUpdatedTaxTotal = parseFloat(tokenRecord.total_accrued_tax_liability_zar || 0.00) + incrementalTaxLiability;
        const nextUsageCountValue = currentUsage + 1;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: nextUsageCountValue,
                total_accrued_tax_liability_zar: nextUpdatedTaxTotal,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        return NextResponse.json({
            success: true,
            dry_run: false,
            data: {
                log_id: dbLogEntry.id,
                type: cleanType.toUpperCase(),
                emission_date: resolvedEmissionDate,
                ...conversionsPayload,
                quota_consumption: `${nextUsageCountValue}/${limitCapacityCap}`,
                accrued_tax_liability_total: nextUpdatedTaxTotal,
                calculation_metadata: metadataLog
            }
        }, { status: 200 });

    } catch (error) {
        console.error('🚨 [B2B Corporate API Tunnel Disruption]:', error.message);
        return NextResponse.json({ error: error.message || 'Internal API core calculation fault.' }, { status: 500 });
    }
}
