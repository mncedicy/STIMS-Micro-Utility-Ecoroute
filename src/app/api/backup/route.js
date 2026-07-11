// src/app/api/backup/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Instantiate our admin client bypass to safely read data tables across RLS boundaries
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. SECURITY LOCKCHECK: Read cookies dynamically from the user request header context
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
        if (authError || !user) {
            return new NextResponse("Security Firewall: Session Unauthorized.", { status: 401 });
        }

        // 2. MULTI-TENANT FILTER: Fetch logs matching this user session ID from ecoroute_emissions_logs
        const { data: logs, error } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select(`
                created_at, id, category_display, carbon_kg, carbon_mt,
                ecoroute_vehicles!inner(user_id)
            `)
            .eq('ecoroute_vehicles.user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return new NextResponse('Date,ID,Category,Carbon_KG,Carbon_MT\n,No personal data assets found matching ledger.', {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="ecoroute-backup-empty.csv"'
                }
            });
        }

        const headers = ['Settlement Timestamp', 'Log Token UUID', 'Classification Framework', 'Carbon Footprint (kg)', 'Carbon Footprint (MT)'];
        const csvRows = [headers.join(',')];

        for (const log of logs) {
            const rowData = [
                `"${new Date(log.created_at).toUTCString()}"`,
                `"${log.id}"`,
                `"${log.category_display}"`,
                log.carbon_kg,
                log.carbon_mt
            ];
            csvRows.push(rowData.join(','));
        }

        return new NextResponse(csvRows.join('\n'), {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="ecoroute-personal-backup-${new Date().toISOString().split('T')[0]}.csv"`,
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error) {
        console.error("⛔ CORE BACKUP ENGINE FAULT:", error.message);
        return NextResponse.json({ error: "Internal compliance backup file generation failure." }, { status: 500 });
    }
}