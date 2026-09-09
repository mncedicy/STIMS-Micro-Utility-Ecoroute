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
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

    if (userVehicleError || !userVehicle) {
        throw new Error(
            `Registered user vehicle profile entry not found (Asset Track Trace ID: ${vehicleId})`
        );
    }
    // 1. Calculate Liters consumed per 100 Kilometres from MPG
    const l100km = userVehicle.combined_mpg
        ? (235.215 / parseFloat(userVehicle.combined_mpg)) : 5.0;
    const actualFuelLitres = distanceKm * (l100km / 100.0);

    let carbonKg = 0;
    const metadata = {
        inputDistance: rawDistance,
        inputUnit: unit,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        vehicleProfile: `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''}`.trim(),
        totalDurationSeconds: osrmContext?.totalDurationSeconds || 0,
        tripLegsArray: osrmContext?.tripLegsArray || [],
        waypointsArray: osrmContext?.waypointsArray || [],
        fuel_litres: parseFloat(actualFuelLitres.toFixed(2)),
        l100km: parseFloat(l100km.toFixed(2)),
    };

    const multiplier = parseFloat(userVehicle.carbon_multiplier);
    const fuelType = (userVehicle.fuel_type || '').toLowerCase();

    // 3. High-Precision Fuel Chemistry Calculation Matrix
    if (fuelType.includes('electric') || fuelType === 'ev') {
        carbonKg = 0; // Tailpipe zero-emissions default
        metadata.calculationMethod = 'PURE_ELECTRIC_ZERO_EMISSION';
        metadata.fuelTypeDetected = 'electric';
    }
    else if (fuelType.includes('gasoline') || fuelType.includes('petrol') || fuelType.includes('regular')) {
        const petrolFactor = 2.31; // Standard kg CO2 per liter for gasoline/petrol
        carbonKg = actualFuelLitres * petrolFactor;
        metadata.calculationMethod = 'FUEL_CHEMISTRY_PETROL';
        metadata.emissionsFactorPerLitre = petrolFactor;
        metadata.fuelTypeDetected = 'petrol';
    }
    else if (fuelType.includes('diesel')) {
        const dieselFactor = 2.68; // Standard kg CO2 per liter for diesel
        carbonKg = actualFuelLitres * dieselFactor;
        metadata.calculationMethod = 'FUEL_CHEMISTRY_DIESEL';
        metadata.emissionsFactorPerLitre = dieselFactor;
        metadata.fuelTypeDetected = 'diesel';
    }
    else if (fuelType.includes('hybrid')) {
        const hybridFactor = 2.31; // Standard base fuel chemistry factor for hybrid powertrains
        carbonKg = actualFuelLitres * hybridFactor;
        metadata.calculationMethod = 'FUEL_CHEMISTRY_HYBRID';
        metadata.emissionsFactorPerLitre = hybridFactor;
        metadata.fuelTypeDetected = 'hybrid';
    }
    // 4. Fallback Priority: Fall back to an explicit profile distance multiplier if fuel data is vague
    else if (!isNaN(multiplier) && multiplier > 0) {
        carbonKg = distanceKm * multiplier;
        metadata.calculationMethod = 'PROFILE_MULTIPLIER_MATCH';
        metadata.multiplierUsed = multiplier;
    }
    // 5. Global Fallback: Standard passenger vehicle multiplier (0.23 kg CO2/km)
    else {
        const globalFallbackFactor = 0.23;
        carbonKg = distanceKm * globalFallbackFactor;
        metadata.calculationMethod = 'GLOBAL_DEFAULT_FALLBACK';
        metadata.multiplierUsed = globalFallbackFactor;
        if (fuelType) metadata.fuelTypeDetected = fuelType;
    }

    // Dynamic field injection for tracking actual visual intensity levels in the interface
    metadata.calculatedEmissionsIntensity = parseFloat((carbonKg / distanceKm).toFixed(6));

    return {
        carbonKg: parseFloat(carbonKg.toFixed(3)),
        metadata,
    };
}
