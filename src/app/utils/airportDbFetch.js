// /src/app/utils/airportDbFetch.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Pure Database Query Layer - 100% Free of Next.js Cache Context Barriers
 */
export async function fetchAirportCoordsFromDatabase(cleanIata) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
                    } catch { /* Safe to ignore in static lookups */ }
                },
            },
        }
    );

    // Dynamic lookups matching your exact static airports table metrics layout
    const { data, error } = await supabase
        .from('ecoroute_static_airports')
        .select('latitude, longitude')
        .eq('iata_code', cleanIata)
        .maybeSingle();

    if (error || !data) {
        console.warn(`[Airport Storage Fetcher] No coordinate records matched for IATA: ${cleanIata}`);
        return null;
    }

    return {
        lat: parseFloat(data.latitude),
        lon: parseFloat(data.longitude)
    };
}
