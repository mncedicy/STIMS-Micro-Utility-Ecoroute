// /src/app/utils/flightCalculator.js
import { getCachedAirportCoords } from './airportCache';

// DEFRA Passenger-Kilometer Emission Factors (kg CO2e per km per passenger)
const FLIGHT_TIERS = {
    DOMESTIC: 0.245,    // Flights < 400 km
    SHORT_HAUL: 0.151,  // Flights between 400 km and 3700 km
    LONG_HAUL: 0.147,   // Flights > 3700 km
};

// Radiative Forcing Index (RFI) multiplier to account for high-altitude climate impacts
const RADIATIVE_FORCING_INDEX = 1.9;

/**
 * Calculates the Great Circle Distance using the Haversine Formula
 */
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
    return EARTH_RADIUS_KM * c; // Distance in kilometers
}

/**
 * Core Flight Calculation Engine
 */
export async function calculateFlightEmissions(originIata, destIata, passengersCount) {
    const pCount = parseInt(passengersCount, 10) || 1;

    // Sanitize inbound text values cleanly
    const startCode = (originIata || '').trim().toUpperCase();
    const endCode = (destIata || '').trim().toUpperCase();

    // 1. Fetch coordinates from your Supabase static table via cache module
    const originCoords = await getCachedAirportCoords(startCode);
    const destCoords = await getCachedAirportCoords(endCode);

    // IMPROVED GLOBAL EXCEPTION CATCH: Return a readable validation error instead of dropping a pipeline crash
    if (!originCoords && !destCoords) {
        throw new Error(`Invalid Flight Route: Neither origin [${startCode}] nor destination [${endCode}] airport codes exist in the database.`);
    }
    if (!originCoords) {
        throw new Error(`Invalid Origin: Airport code [${startCode}] not recognized in the aviation database.`);
    }
    if (!destCoords) {
        throw new Error(`Invalid Destination: Airport code [${endCode}] not recognized in the aviation database.`);
    }
    if (startCode === endCode) {
        throw new Error(`Invalid Route: Flight origin and destination cannot match the same terminal location [${startCode}].`);
    }

    // 2. Compute true spherical distance
    const distanceKm = calculateHaversineDistance(
        originCoords.lat,
        originCoords.lon,
        destCoords.lat,
        destCoords.lon
    );

    // 3. Determine distance-tiered emission coefficient
    let factor = FLIGHT_TIERS.SHORT_HAUL;
    let tierDisplay = 'SHORT_HAUL';

    if (distanceKm < 400) {
        factor = FLIGHT_TIERS.DOMESTIC;
        tierDisplay = 'DOMESTIC';
    } else if (distanceKm > 3700) {
        factor = FLIGHT_TIERS.LONG_HAUL;
        tierDisplay = 'LONG_HAUL';
    }

    // 4. Run the final carbon calculation formula
    const carbonKg = distanceKm * factor * pCount * RADIATIVE_FORCING_INDEX;

    return {
        carbonKg: parseFloat(carbonKg.toFixed(3)),
        metadata: {
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            flightTier: tierDisplay,
            passengers: pCount,
            factorUsed: factor,
            rfiApplied: RADIATIVE_FORCING_INDEX,
            route: `${startCode} -> ${endCode}`
        }
    };
}
