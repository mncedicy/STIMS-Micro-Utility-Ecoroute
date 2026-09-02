import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Establish administrative fallback client hook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to safely escape CSV fields containing commas, quotes, or newlines
const sanitizeCsvField = (value) => {
    if (value === null || value === undefined) return '';
    const strValue = String(value);
    if (/[",\n\r]/.test(strValue)) {
        return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
};

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const queryUserId = searchParams.get('userId');

        let targetUserId = queryUserId || null;

        // Fallback: Hydrate from Next.js server cookies jar context
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

        // Absolute security validation check boundary
        if (!targetUserId) {
            return new Response('Unauthorized: User reference token parameters missing.', { status: 401 });
        }

        // Fetch vehicle telemetry columns
        const { data: vehicles, error } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Defined CSV Headers excluding user_id and created_at
        const headers = [
            'VEHICLE_ID',
            'REGISTRATION_PLATE',
            'MAKE',
            'MODEL',
            'YEAR',
            'FUEL_TYPE',
            'CLASSIFICATION',
            'DRIVETRAIN',
            'ENGINE_CAPACITY',
            'TRANSMISSION',
            'COMBINED_MPG',
            'CO2_TAILPIPE_GPM',
            'CARBON_MULTIPLIER_KG_KM',
            'IS_ACTIVE'
        ];

        let csvContent = headers.join(',') + '\n';

        (vehicles || []).forEach(vehicle => {
            const row = [
                sanitizeCsvField(vehicle.id),
                sanitizeCsvField(vehicle.registration_number),
                sanitizeCsvField(vehicle.make),
                sanitizeCsvField(vehicle.model),
                sanitizeCsvField(vehicle.year),
                sanitizeCsvField(vehicle.fuel_type),
                sanitizeCsvField(vehicle.classification),
                sanitizeCsvField(vehicle.drivetrain),
                sanitizeCsvField(vehicle.engine_capacity),
                sanitizeCsvField(vehicle.transmission),
                sanitizeCsvField(vehicle.combined_mpg),
                sanitizeCsvField(vehicle.co2_tailpipe_gpm),
                sanitizeCsvField(vehicle.carbon_multiplier),
                sanitizeCsvField(vehicle.is_active)
            ];

            csvContent += row.join(',') + '\n';
        });

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename=ecoroute_fleet_registry.csv'
            }
        });

    } catch (err) {
        console.error('[Vehicles CSV Exporter Error]:', err);
        return new Response('Database file extraction channel failure: ' + err.message, { status: 500 });
    }
}