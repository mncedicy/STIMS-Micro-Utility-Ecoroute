// /src/app/api/export/pdf/route.js
import { createClient } from '@supabase/supabase-js';
import { buildCompliancePdfBuffer } from './pdfGeneratorService';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // FIXED PARSING: Extract current calendar month active filter constraints from URL query parameters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!userId) {
            return new Response('Missing target user tracking credentials parameter.', { status: 400 });
        }

        // Fetch corresponding user corporate profile details
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // Target emissions log table ledger rows
        let logsQuery = supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('*')
            .eq('user_id', userId)
            .order('emission_date', { ascending: false });

        // FIXED FILTER APPLIED: If month window boundaries are passed from the UI, trim data logs before generating the PDF file buffer
        if (startDate && endDate) {
            logsQuery = logsQuery.gte('emission_date', startDate).lte('emission_date', endDate);
        }

        const { data: logs, error: logsError } = await logsQuery;
        if (logsError) throw logsError;

        const subtitleRangeContext = startDate && endDate
            ? `AUDIT FILTER RANGE: ${startDate} TO ${endDate}`
            : 'CONSOLIDATED ENTERPRISE HISTORICAL COMPLIANCE RECORD SUMMARY';

        // Compiles your white clean layout report using the properly sliced logs array context
        const pdfBuffer = await buildCompliancePdfBuffer(profile, logs || [], subtitleRangeContext);

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=ecoroute_compliance_audit_report.pdf'
            }
        });

    } catch (err) {
        console.error('[PDF Route Exporter Crash]:', err);
        return new Response('Internal compilation disruption: ' + err.message, { status: 500 });
    }
}
