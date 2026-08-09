// /src/app/api/export/vehicles/route.js
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Establish an administrative fallback client hook to protect data queries if session headers drop
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const queryUserId = searchParams.get('userId');

        let targetUserId = queryUserId || null;

        // Fallback: If no explicit query ID is provided, try hydrating from Next.js server cookies jar context
        if (!targetUserId) {
            const cookieStore = await cookies();
            const supabaseServer = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                {
                    cookies: {
                        getAll() { return cookieStore.getAll(); },
                        setAll() { }
                    },
                }
            );
            const { data: { session } } = await supabaseServer.auth.getSession();
            if (session?.user?.id) {
                targetUserId = session.user.id;
            }
        }

        // Absolute security validation check boundary: fail out if both channels are missing user keys
        if (!targetUserId) {
            return new Response('Unauthorized: User reference token parameters missing.', { status: 401 });
        }

        // Query active fleet rows linked to this specific user account natively using your indexes
        const { data: vehicles, error } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('id, registration_number, make, model, year, carbon_multiplier')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Establish clear CSV column headers row text
        let csvContent = 'VEHICLE_ID,REGISTRATION_PLATE,MAKE,MODEL,YEAR,MULTIPLIER\n';

        (vehicles || []).forEach(vehicle => {
            const cleanReg = (vehicle.registration_number || '').replace(/,/g, ' ').trim().toUpperCase();
            const cleanMake = (vehicle.make || '').replace(/,/g, ' ').trim();
            const cleanModel = (vehicle.model || '').replace(/,/g, ' ').trim();

            csvContent += `${vehicle.id},"${cleanReg}","${cleanMake}","${cleanModel}",${vehicle.year},${vehicle.carbon_multiplier}\n`;
        });

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename=ecoroute_my_vehicles_registry.csv'
            }
        });

    } catch (err) {
        console.error('[Vehicles CSV Exporter Error]:', err);
        return new Response('Database file extraction channel failure: ' + err.message, { status: 500 });
    }
}
