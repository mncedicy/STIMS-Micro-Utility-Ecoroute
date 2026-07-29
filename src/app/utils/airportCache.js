// /src/app/utils/airportCache.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Pure Real-time Airport Lookup Engine (Next.js 16 / Turbopack Safe)
 * Completely free of compilation caching restrictions.
 */
export async function getCachedAirportCoords(airportIdentifier) {
    if (!airportIdentifier) return null;

    const cleanIdString = airportIdentifier.trim();
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
                    } catch { /* Safe to ignore in static read parameters */ }
                },
            },
        }
    );

    let query = supabase.from('ecoroute_static_airports').select('latitude, longitude');

    // FIXED SEARCH LOGIC: If a numeric ID is supplied, check the id column natively. 
    // Fall back to matching names to ensure backwards compatibility with older entry components.
    if (/^\d+$/.test(cleanIdString)) {
        query = query.eq('id', parseInt(cleanIdString, 10));
    } else {
        query = query.eq('name', cleanIdString);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
        console.warn(`[Airport Database Engine] Look up failed for identifier parameter: ${cleanIdString}`);
        return null;
    }

    return {
        lat: parseFloat(data.latitude),
        lon: parseFloat(data.longitude)
    };
}
