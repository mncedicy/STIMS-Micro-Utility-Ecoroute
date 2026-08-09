// /src/app/api/export/airports/route.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
    try {
        // Query all airports arranged sequentially from your static database table
        const { data: airports, error } = await supabaseAdmin
            .from('ecoroute_static_airports')
            .select('id, name, iso_country, municipality')
            .order('name', { ascending: true });

        if (error) throw error;

        // Establish clean CSV column titles headers row text
        let csvContent = 'AIRPORT_ID,AIRPORT_NAME,COUNTRY_CODE,MUNICIPALITY\n';

        (airports || []).forEach(airport => {
            // Strip out conflicting commas or broken quotes that break CSV line cells
            const cleanName = (airport.name || '').replace(/,/g, ' ').replace(/"/g, '""').trim();
            const cleanCountry = (airport.iso_country || '').trim().toUpperCase();
            const cleanMuni = (airport.municipality || '').replace(/,/g, ' ').replace(/"/g, '""').trim();

            csvContent += `${airport.id},"${cleanName}","${cleanCountry}","${cleanMuni}"\n`;
        });

        // Output raw array text buffers directly back to browser download streams
        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename=ecoroute_static_airports_registry.csv'
            }
        });

    } catch (err) {
        console.error('[Airports CSV Exporter Disruption]:', err);
        return new Response('Database file extraction channel failure: ' + err.message, { status: 500 });
    }
}
