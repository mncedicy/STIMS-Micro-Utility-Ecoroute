// /src/app/utils/vehicleCalculator.js
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

/**
 * Core Vehicle Emissions Calculation Engine
 */
export async function calculateVehicleEmissions(
    vehicleId,
    distance,
    unit,
    tokenFallback = '',
    osrmContext = null
) {
    // Next.js asynchronous server context initialization
    const cookieStore = await cookies();
    const headersList = await headers();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase environment variables are missing');
    }

    const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    /* Safe to ignore in backend script layers */
                }
            },
        },
    });

    // Hydrate tokens cleanly for standard user parameter lookups
    const authHeader = headersList.get('authorization') || '';
    const extractedToken =
        tokenFallback ||
        (authHeader.startsWith('Bearer ')
            ? authHeader.substring(7).trim()
            : '');

    if (extractedToken && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            await supabase.auth.setSession({
                access_token: extractedToken,
                refresh_token: '',
            });
        } catch (err) {
            console.error(
                '[Vehicle Calculator Token Hydration Fault]:',
                err.message
            );
        }
    }

    const rawDistance = parseFloat(distance);
    if (isNaN(rawDistance) || rawDistance <= 0) {
        throw new Error('Invalid distance input values');
    }

    // 1. Standardise distance tracking metrics consistently
    const distanceKm =
        unit?.toLowerCase() === 'miles' ? rawDistance * 1.609344 : rawDistance;

    // 2. Fetch the user fleet registration asset row directly
    const { data: userVehicle, error: userVehicleError } = await supabase
        .from('ecoroute_vehicles')
        .select('id, make, model, year, fuel_type, carbon_multiplier')
        .eq('id', vehicleId)
        .maybeSingle();

    if (userVehicleError || !userVehicle) {
        throw new Error(
            `Registered user vehicle profile entry not found (Asset Track Trace ID: ${vehicleId})`
        );
    }

    let carbonKg = 0;
    const metadata = {
        inputDistance: rawDistance,
        inputUnit: unit,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        vehicleProfile: `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''}`.trim(),
        totalDurationSeconds: osrmContext?.totalDurationSeconds || 0,
        tripLegsArray: osrmContext?.tripLegsArray || [],
        waypointsArray: osrmContext?.waypointsArray || [],
    };

    const multiplier = parseFloat(userVehicle.carbon_multiplier);
    const fuelType = (userVehicle.fuel_type || '').toLowerCase();

    // 3. Priority 1: Check for explicit carbon multiplier on the vehicle record
    if (!isNaN(multiplier) && multiplier > 0) {
        carbonKg = distanceKm * multiplier;
        metadata.calculationMethod = 'PROFILE_MULTIPLIER_MATCH';
        metadata.multiplierUsed = multiplier;
    }
    // 4. Priority 2: Calculate based on vehicle fuel type if specified
    else if (fuelType.includes('electric') || fuelType === 'ev') {
        carbonKg = 0; // Tailpipe zero-emissions default
        metadata.calculationMethod = 'PURE_ELECTRIC_ZERO_EMISSION';
        metadata.fuelTypeDetected = 'electric';
    } else if (fuelType.includes('diesel')) {
        const dieselFactor = 0.26; // Average kg CO2/km for diesel fleet asset
        carbonKg = distanceKm * dieselFactor;
        metadata.calculationMethod = 'FUEL_TYPE_DIESEL_FACTOR';
        metadata.multiplierUsed = dieselFactor;
        metadata.fuelTypeDetected = 'diesel';
    } else if (fuelType.includes('hybrid')) {
        const hybridFactor = 0.12; // Average kg CO2/km for hybrid fleet asset
        carbonKg = distanceKm * hybridFactor;
        metadata.calculationMethod = 'FUEL_TYPE_HYBRID_FACTOR';
        metadata.multiplierUsed = hybridFactor;
        metadata.fuelTypeDetected = 'hybrid';
    }
    // 5. Priority 3: Fallback standard passenger vehicle multiplier (0.23 kg CO2/km)
    else {
        const globalFallbackFactor = 0.23;
        carbonKg = distanceKm * globalFallbackFactor;
        metadata.calculationMethod = 'GLOBAL_DEFAULT_FALLBACK';
        metadata.multiplierUsed = globalFallbackFactor;
        if (fuelType) metadata.fuelTypeDetected = fuelType;
    }

    return {
        carbonKg: parseFloat(carbonKg.toFixed(3)),
        metadata,
    };
}