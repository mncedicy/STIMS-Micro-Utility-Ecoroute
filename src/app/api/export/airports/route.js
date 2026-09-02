// /src/app/api/export/airports/route.js

export async function GET() {
    try {
        const TARGET_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

        // Fetch raw CSV data stream directly from OurAirports
        const response = await fetch(TARGET_URL, {
            headers: {
                'User-Agent': 'EcoRoute-System-Agent/1.0'
            },
            // Revalidate every 24 hours (86400 seconds) or keep 'no-store' for live fetch
            next: { revalidate: 86400 }
        });

        if (!response.ok) {
            throw new Error(`Upstream network error: ${response.status} ${response.statusText}`);
        }

        const csvData = await response.text();

        // Output raw array text buffers directly back to browser download streams
        return new Response(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename=ourairports_global_registry.csv',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400'
            }
        });

    } catch (err) {
        console.error('[Airports External CSV Exporter Disruption]:', err);
        return new Response(
            JSON.stringify({
                error: 'External CSV extraction channel failure',
                details: err.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}