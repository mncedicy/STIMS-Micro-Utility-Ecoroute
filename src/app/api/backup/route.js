import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
    try {
        // 1. Extract all historical data logs from Supabase
        const { data: logs, error } = await supabase
            .from('emissions_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Handle empty table database states safely
        if (!logs || logs.length === 0) {
            return new NextResponse('Date,ID,Category,Carbon_KG,Carbon_MT\n,No data assets found matching ledger.', {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="ecoroute-backup-empty.csv"'
                }
            });
        }

        // 3. Define human-readable spreadsheet columns headers row
        const headers = ['Settlement Timestamp', 'Log Token UUID', 'Classification Framework', 'Carbon Footprint (kg)', 'Carbon Footprint (MT)'];

        // Build the CSV string layout block sequentially
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

        const completeCsvString = csvRows.join('\n');

        // 4. Stream string bytes out with forced binary file layout download headers
        return new NextResponse(completeCsvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="ecoroute-backup-${new Date().toISOString().split('T')[0]}.csv"`,
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error) {
        console.error("⛔ CORE DATA BACKUP WRITER CRASH SYSTEM EVENT:", error.message);
        return NextResponse.json({ error: "Internal compliance backup file generation engine crash event." }, { status: 500 });
    }
}
