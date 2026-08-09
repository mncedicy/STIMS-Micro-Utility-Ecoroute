// /src/app/utils/flightCalculator.js
import { createClient } from '@supabase/supabase-js';

// Initialize clean administrative access bypass wrapper pipelines
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const FLIGHT_TIERS = {
    DOMESTIC: 0.245,    // Flights < 400 km
    SHORT_HAUL: 0.151,  // Flights between 400 km and 3700 km
    LONG_HAUL: 0.147,   // Flights > 3700 km
};

const RADIATIVE_FORCING_INDEX = 1.9;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const EARTH_RADIUS_KM = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Enhanced Flight Calculation Engine (Saves textual labels inside the database metadata payload)
 */
export async function calculateFlightEmissions(originId, destId, passengersCount) {
    const pCount = parseInt(passengersCount, 10) || 1;

    // 1. Concurrently fetch full airport details from your exact ecoroute_static_airports table using indexes
    const [originRes, destRes] = await Promise.all([
        supabaseAdmin.from('ecoroute_static_airports').select('name, iso_country, latitude, longitude').eq('id', parseInt(originId, 10)).maybeSingle(),
        supabaseAdmin.from('ecoroute_static_airports').select('name, iso_country, latitude, longitude').eq('id', parseInt(destId, 10)).maybeSingle()
    ]);

    if (!originRes.data || !destRes.data) {
        throw new Error('Compliance Lookup Failure: Selected airport terminal IDs missing from core database.');
    }

    const origin = originRes.data;
    const dest = destRes.data;

    // 2. Compute spherical distance vector paths
    const distanceKm = calculateHaversineDistance(
        parseFloat(origin.latitude),
        parseFloat(origin.longitude),
        parseFloat(dest.latitude),
        parseFloat(dest.longitude)
    );

    // 3. Determine tiered metrics
    let factor = FLIGHT_TIERS.SHORT_HAUL;
    let tierDisplay = 'SHORT_HAUL';

    if (distanceKm < 400) {
        factor = FLIGHT_TIERS.DOMESTIC;
        tierDisplay = 'DOMESTIC';
    } else if (distanceKm > 3700) {
        factor = FLIGHT_TIERS.LONG_HAUL;
        tierDisplay = 'LONG_HAUL';
    }

    const rawCarbonKg = distanceKm * factor * pCount * RADIATIVE_FORCING_INDEX;

    // 4. Return complete, flattened text summary metadata payload ready for database ingestion
    return {
        carbonKg: rawCarbonKg,
        metadata: {
            origin_name: origin.name,
            origin_country: origin.iso_country.toUpperCase(),
            destination_name: dest.name,
            destination_country: dest.iso_country.toUpperCase(),
            route_display: `${origin.name} (${origin.iso_country}) ➔ ${dest.name} (${dest.iso_country})`,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            flightTier: tierDisplay,
            passengers: pCount,
            factorUsed: factor,
            rfiApplied: RADIATIVE_FORCING_INDEX,
            timestamp: new Date().toISOString()
        }
    };
}
