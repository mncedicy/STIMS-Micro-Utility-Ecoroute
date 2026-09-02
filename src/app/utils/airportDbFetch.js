/**
 * Pure Database Query Layer - Resolves Airport Coordinates by ID, IATA, ICAO, or Name
 */
export async function fetchAirportCoordsFromDatabase(cleanIdentifier) {
    if (!cleanIdentifier) return null;

    const identifier = cleanIdentifier.toString().trim().toUpperCase();

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
            const name = cols[3]?.toUpperCase();
            const lat = parseFloat(cols[4]);
            const lon = parseFloat(cols[5]);
            const iata = cols[13]?.toUpperCase();

            if (identifier === id || identifier === iata || identifier === icao || identifier === name) {
                if (!isNaN(lat) && !isNaN(lon)) {
                    return { lat, lon };
                }
            }
        }
    } catch (err) {
        console.warn(`[Airport Storage Fetcher] Coordinate lookup error for identifier '${identifier}':`, err.message);
    }

    return null;
}