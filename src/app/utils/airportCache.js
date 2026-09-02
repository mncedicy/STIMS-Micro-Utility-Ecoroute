/**
 * Pure Real-time Airport Lookup Engine (Next.js 16 / Turbopack Safe)
 */
export async function getCachedAirportCoords(airportIdentifier) {
    if (!airportIdentifier) return null;

    const cleanIdString = airportIdentifier.toString().trim().toUpperCase();

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
            const lat = parseFloat(cols[4]);
            const lon = parseFloat(cols[5]);
            const iata = cols[13]?.toUpperCase();
            const name = cols[3]?.toUpperCase();

            if (cleanIdString === id || cleanIdString === iata || cleanIdString === icao || cleanIdString === name) {
                if (!isNaN(lat) && !isNaN(lon)) {
                    return { lat, lon };
                }
            }
        }
    } catch (err) {
        console.warn(`[Airport Database Engine] Lookup failed for parameter '${cleanIdString}':`, err.message);
    }

    return null;
}