// /src/app/api/estimates/route.js
import { NextResponse } from 'next/server';
import { getEstimatesSupabaseClient } from './supabaseClient';
import { processCategoryEmissions } from './categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { createClient } from '@supabase/supabase-js';

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
            console.warn('[API Auth Block]: Secure server validation rejected cookie tokens and bearer headers.');
            return NextResponse.json({ error: 'Unauthorized user access' }, { status: 401 });
        }

        const body = await req.json();
        if (!body.type) {
            return NextResponse.json({ error: 'Calculation category parameter type is required' }, { status: 400 });
        }

        const cleanType = body.type.toLowerCase();
        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, body, bearerToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serverWriteClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceRoleKey,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        // BYPASS TYPE LENGTH CONSTRAINTS: Passes custom labels via 'raw_payload' object mappings to prevent schema length violations
        const { data: dbLogEntry, error: dbWriteError } = await serverWriteClient
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

                // Keep legacy columns safe for non-overflow parameters, or short fallback characters
                origin_iata: cleanType === 'flight' ? body.origin_iata?.substring(0, 3).toUpperCase() : null,
                dest_iata: cleanType === 'flight' ? body.dest_iata?.substring(0, 3).toUpperCase() : null,

                passengers_count: cleanType === 'flight' ? parseInt(body.passengers, 10) : null,
                cargo_weight: cleanType === 'shipping' ? parseFloat(body.cargo_weight) : null,
                mass_unit: cleanType === 'shipping' ? body.mass_unit : null,
                energy_kwh: cleanType === 'electricity' ? parseFloat(body.kwh) : null,
                country_code: cleanType === 'electricity' ? body.country_code?.toUpperCase() : null,
                gas_quantity: cleanType === 'gas' ? parseFloat(body.quantity) : null,
                gas_type: cleanType === 'gas' ? body.gas_type : null,
                gas_unit: cleanType === 'gas' ? body.gas_unit : null,

                raw_payload: {
                    ...conversionsPayload,
                    metadata: metadataLog,
                    global_flight_route: cleanType === 'flight' ? {
                        origin_name_full: body.origin_iata,
                        destination_name_full: body.dest_iata
                    } : null
                }
            })
            .select()
            .single();

        if (dbWriteError) {
            console.error('[API Estimates Engine DB Error]:', dbWriteError.message);
            return NextResponse.json({ error: `Database policy restriction: ${dbWriteError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: dbLogEntry }, { status: 200 });

    } catch (error) {
        console.error("🚨 EcoRoute API Orchestrator Crash:", error.message);
        return NextResponse.json({ error: error.message || "Internal server computation failure." }, { status: 500 });
    }
}
