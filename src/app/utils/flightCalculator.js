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
 * Robust airport record lookup from remote repository
 */
async function fetchAirportRecord(identifier) {
    if (!identifier) return null;
    const cleanId = identifier.toString().trim().toUpperCase();

    try {
        const res = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv', {
            next: { revalidate: 86400 }
        });

        if (!res.ok) return null;
        const text = await res.text();
        const lines = text.split('\n');

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            const id = cols[0];
            const icao = cols[1]?.toUpperCase();
            const name = cols[3];
            const lat = parseFloat(cols[4]);
            const lon = parseFloat(cols[5]);
            const isoCountry = cols[8];
            const iata = cols[13]?.toUpperCase();

            if (cleanId === id || cleanId === iata || cleanId === icao || cleanId === name.toUpperCase()) {
                if (!isNaN(lat) && !isNaN(lon)) {
                    return {
                        id,
                        name,
                        iso_country: isoCountry || 'ZA',
                        iata_code: iata || icao || '',
                        latitude: lat,
                        longitude: lon
                    };
                }
            }
        }
    } catch (err) {
        console.warn(`[Flight Calculator] Record '${cleanId}' resolution error:`, err.message);
    }

    return null;
}

/**
 * Enhanced Flight Calculation Engine with Safe Fallbacks
 */
export async function calculateFlightEmissions(originIdentifier, destIdentifier, passengersCount) {
    const pCount = parseInt(passengersCount, 10) || 1;

    // 1. Concurrently resolve airport records
    const [origin, dest] = await Promise.all([
        fetchAirportRecord(originIdentifier),
        fetchAirportRecord(destIdentifier)
    ]);

    // 2. Fallback handling if an airport ID is missing
    if (!origin || !dest) {
        const missingId = !origin ? originIdentifier : destIdentifier;
        console.warn(`[Flight Calculator Fallback Triggered] Using baseline parameters for missing identifier: ${missingId}`);

        const defaultDistanceKm = 500;
        const factor = FLIGHT_TIERS.SHORT_HAUL;
        const fallbackCarbonKg = defaultDistanceKm * factor * pCount * RADIATIVE_FORCING_INDEX;

        return {
            carbonKg: parseFloat(fallbackCarbonKg.toFixed(2)),
            carbon_mt: parseFloat((fallbackCarbonKg / 1000).toFixed(4)),
            metadata: {
                origin_name: origin?.name || `Terminal ID ${originIdentifier}`,
                origin_country: (origin?.iso_country || 'ZA').toUpperCase(),
                destination_name: dest?.name || `Terminal ID ${destIdentifier}`,
                destination_country: (dest?.iso_country || 'ZA').toUpperCase(),
                route_display: `Terminal ${originIdentifier} ➔ Terminal ${destIdentifier} (Approximated)`,
                distanceKm: defaultDistanceKm,
                flightTier: 'SHORT_HAUL',
                passengers: pCount,
                is_fallback: true,
                notice: `Calculated using baseline flight parameters because terminal ID '${missingId}' was not found.`,
                timestamp: new Date().toISOString()
            }
        };
    }

    // 3. Compute spherical distance vector paths
    const distanceKm = calculateHaversineDistance(
        parseFloat(origin.latitude),
        parseFloat(origin.longitude),
        parseFloat(dest.latitude),
        parseFloat(dest.longitude)
    );

    // 4. Determine tiered metrics
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

    return {
        carbonKg: parseFloat(rawCarbonKg.toFixed(2)),
        carbon_mt: parseFloat((rawCarbonKg / 1000).toFixed(4)),
        metadata: {
            origin_name: origin.name,
            origin_country: (origin.iso_country || 'UNKNOWN').toUpperCase(),
            origin_iata: origin.iata_code || '',
            destination_name: dest.name,
            destination_country: (dest.iso_country || 'UNKNOWN').toUpperCase(),
            destination_iata: dest.iata_code || '',
            route_display: `${origin.name} (${origin.iata_code || origin.iso_country}) ➔ ${dest.name} (${dest.iata_code || dest.iso_country})`,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            flightTier: tierDisplay,
            passengers: pCount,
            factorUsed: factor,
            rfiApplied: RADIATIVE_FORCING_INDEX,
            timestamp: new Date().toISOString()
        }
    };
}