// /src/app/utils/vehicleCalculator.js
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

/**
 * Core Vehicle Emissions Calculation Engine (Optimized for Fueleconomy.gov strict schema)
 */
// FIXED: Appended optional 'osrmContext' payload object to the function parameter footprint cleanly
export async function calculateVehicleEmissions(vehicleId, distance, unit, tokenFallback = '', osrmContext = null) {
    // Next.js asynchronous server context initialization
    const cookieStore = await cookies();
    const headersList = await headers();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createServerClient(
        supabaseUrl,
        serviceRoleKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* Safe to ignore in backend script layers */ }
                },
            },
        }
    );

    // Hydrate tokens cleanly for standard user parameter lookups
    const authHeader = headersList.get('authorization') || '';
    const extractedToken = tokenFallback || (authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '');

    if (extractedToken && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            await supabase.auth.setSession({
                access_token: extractedToken,
                refresh_token: ''
            });
        } catch (err) {
            console.error('[Vehicle Calculator Token Hydration Fault]:', err.message);
        }
    }

    const rawDistance = parseFloat(distance);
    if (isNaN(rawDistance) || rawDistance <= 0) throw new Error('Invalid distance input values');

    // 1. Standardise distance tracking metrics consistently
    const distanceKm = unit?.toLowerCase() === 'miles' ? rawDistance * 1.609344 : rawDistance;
    const distanceMiles = distanceKm * 0.621371192;

    // 2. Fetch the user fleet registration asset row cleanly
    const { data: userVehicle, error: userVehicleError } = await supabase
        .from('ecoroute_vehicles')
        .select('id, make, model, year, carbon_multiplier')
        .eq('id', vehicleId)
        .maybeSingle();

    if (userVehicleError || !userVehicle) {
        throw new Error(`Registered user vehicle profile entry not found (Asset Track Trace ID: ${vehicleId})`);
    }

    let carbonKg = 0;
    let metadata = {
        inputDistance: rawDistance,
        inputUnit: unit,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        vehicleProfile: `${userVehicle.year} ${userVehicle.make} ${userVehicle.model}`,

        // FIXED: Conditional merging layout assigns OSRM arrays down the UI stack pipeline safely
        totalDurationSeconds: osrmContext?.totalDurationSeconds || 0,
        tripLegsArray: osrmContext?.tripLegsArray || [],
        waypointsArray: osrmContext?.waypointsArray || []
    };

    // 3. Fallback logic: check if a custom override modifier is active (not the default 0.23)
    const multiplier = parseFloat(userVehicle.carbon_multiplier);

    if (multiplier !== 0.23) {
        carbonKg = distanceKm * multiplier;
        metadata.calculationMethod = 'PROFILE_MULTIPLIER_MATCH';
        metadata.multiplierUsed = multiplier;
    } else {
        // 4. Perform direct static dataset lookup matching your indexed columns (year, make, model)
        const { data: staticData } = await supabase
            .from('ecoroute_static_vehicles')
            .select('co2_tailpipe_gpm, comb_mpg_1, fuel_type_1, comb_kwh_100mi')
            .eq('make', userVehicle.make)
            .eq('model', userVehicle.model)
            .eq('year', userVehicle.year)
            .limit(1)
            .maybeSingle();

        if (staticData) {
            const gpmFactor = parseFloat(staticData.co2_tailpipe_gpm || 0);
            const mpgFactor = parseFloat(staticData.comb_mpg_1 || 0);
            const kwhFactor = parseFloat(staticData.comb_kwh_100mi || 0);
            const fuelType = (staticData.fuel_type_1 || '').toLowerCase();

            // FIX: Identify absolute Electric Vehicles (EV) natively from fuel type
            if (fuelType.includes('electricity') || fuelType === 'electric') {
                if (kwhFactor > 0) {
                    // Calculate based on indirect grid charging carbon intensity (SA grid standard ~0.94kg/kWh)
                    const totalKwhConsumed = (distanceMiles / 100) * kwhFactor;
                    carbonKg = totalKwhConsumed * 0.94;
                    metadata.calculationMethod = 'EPA_ELECTRIC_GRID_INTELLIGENCE';
                    metadata.kwhPer100Miles = kwhFactor;
                } else {
                    carbonKg = 0; // Pure clean zero emissions tailpipe fallback
                    metadata.calculationMethod = 'PURE_ELECTRIC_ZERO_EMISSION';
                }
                metadata.fuelTypeDetected = 'electricity';
            }
            // Standard Combustion Engine matching direct Grams Per Mile CO2 Data
            else if (gpmFactor > 0) {
                carbonKg = (distanceMiles * gpmFactor) / 1000;
                metadata.calculationMethod = 'EPA_STATIC_CO2_GPM_MATCH';
                metadata.co2Gpm = gpmFactor;
                metadata.fuelTypeDetected = fuelType;
            }
            // Direct calculation lookup backup based on MPG fuel consumption bounds
            else if (mpgFactor > 0) {
                const gallonsConsumed = distanceMiles / mpgFactor;
                const isDiesel = fuelType.includes('diesel');
                const kgPerGallon = isDiesel ? 10.18 : 8.887;

                carbonKg = gallonsConsumed * kgPerGallon;
                metadata.calculationMethod = 'EPA_STATIC_MPG_FUEL_CALC';
                metadata.mpgUsed = mpgFactor;
                metadata.fuelTypeDetected = isDiesel ? 'diesel' : 'gasoline';
            }
            // Schema safety fallback if database matching columns are empty defaults
            else {
                carbonKg = distanceKm * 0.23;
                metadata.calculationMethod = 'SCHEMA_GLOBAL_FALLBACK';
                metadata.multiplierUsed = 0.23;
            }
        } else {
            // No matching record found in ecoroute_static_vehicles
            carbonKg = distanceKm * 0.23;
            metadata.calculationMethod = 'SCHEMA_GLOBAL_FALLBACK';
            metadata.multiplierUsed = 0.23;
        }
    }

    return {
        carbonKg: parseFloat(carbonKg.toFixed(3)),
        metadata
    };
}
