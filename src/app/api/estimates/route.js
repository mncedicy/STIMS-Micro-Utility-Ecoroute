// /src/app/api/estimates/route.js
import { NextResponse } from 'next/server';
import { getEstimatesSupabaseClient } from '../estimates/supabaseClient';
import { processCategoryEmissions } from './categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

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

        // 1. Fetch token record and user corporate details concurrently
        const [prof, tokenQuery] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        const currentUsageCount = tokenQuery.data?.current_monthly_usage || 0;
        const capacityLimitBounds = tokenQuery.data?.usage_limit_cap || 100;

        if (currentUsageCount >= capacityLimitBounds) {
            return NextResponse.json({
                error: `Quota Blocked: Monthly request volume exhausted. Current limit: ${currentUsageCount}/${capacityLimitBounds} requests. Upgrade account tier to extend limits.`
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
            : new Date().toISOString().split('T')[0];

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

                raw_payload: {
                    ...conversionsPayload,
                    metadata: {
                        ...metadataLog,
                        userAssignedDate: resolvedEmissionDate
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

        // 3. Atomically update usage tracks across all plan configurations
        const nextUsageCountValue = currentUsageCount + 1;
        const currentPeriodKey = tokenQuery.data?.last_reset_period || new Date().toISOString().split('T')[0];

        // Resolve real-time name matching rules
        const resolvedEnterpriseName = prof.data?.company?.trim()
            ? prof.data.company.trim()
            : `${prof.data?.first_name || 'Independent'} ${prof.data?.surname || 'Enterprise'}`.trim();

        // FIXED CRYPTOGRAPHIC GENERATOR: Instantiated securely ahead of transactional updates
        const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        // FIXED UPSERT ROUTINE LAYER: Safely integrates your signature variables loop layout
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .upsert({
                id: tokenQuery.data?.id || undefined,
                user_id: user.id,
                organization_name: resolvedEnterpriseName,
                api_token: tokenQuery.data?.api_token || secureHexKey,
                current_monthly_usage: nextUsageCountValue,
                usage_limit_cap: capacityLimitBounds,
                last_reset_period: currentPeriodKey,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        try {
            revalidatePath('/');
            revalidatePath('/dashboard');
        } catch (cacheErr) {
            console.warn('[Cache Revalidation Bypass]:', cacheErr.message);
        }

        const responseData = {
            ...dbLogEntry,
            tokenRecord: {
                ...tokenQuery.data,
                current_monthly_usage: nextUsageCountValue,
                last_reset_period: currentPeriodKey,
                organization_name: resolvedEnterpriseName
            }
        };

        return NextResponse.json({ success: true, data: responseData }, { status: 200 });

    } catch (error) {
        console.error("🚨 EcoRoute API Orchestrator Crash:", error.message);
        return NextResponse.json({ error: error.message || "Internal server computation failure." }, { status: 500 });
    }
}
