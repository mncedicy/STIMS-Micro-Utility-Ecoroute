// src/app/api/export/pdf/route.js

import { createClient } from '@supabase/supabase-js';
import { buildCompliancePdfBuffer } from './pdfGeneratorService';
import { updateUsage } from '../../../utils/dispatch/tokenHelpers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // Extract month window boundaries and dynamic entity selection targets
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const filterId = searchParams.get('filterId') || 'all';
        const logId = searchParams.get('logId');
        const exportType = searchParams.get('exportType') || 'single';

        // Read usage bypass condition flags passed during server-to-server operations
        const bypassUsage = searchParams.get('bypassUsage') === 'true';

        if (!userId) {
            return new Response('Missing target user tracking credentials parameter.', { status: 400 });
        }

        // 1. CONDITIONAL TOKEN DEDUCTION: Only charge here if this isn't an internal server bypass flag
        if (!bypassUsage) {
            const usageResult = await updateUsage(userId, 1);
            if (usageResult.exceeded) {
                return new Response(`RESOURCE EXHAUSTED: ${usageResult.message}`, { status: 429 });
            }
        }

        // Fetch corresponding user corporate profile details
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();


        // Target emissions log table ledger rows (Filtering out excluded logs)
        let logsQuery = supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('*')
            .eq('user_id', userId)
            .neq('print_status', 'excluded');

        // ENHANCED GRANULAR FILTER ENGINE
        if (exportType === 'single' && logId) {
            logsQuery = logsQuery.eq('id', logId);
        } else {
            // Apply historical calendar month windows
            if (startDate && endDate) {
                logsQuery = logsQuery.gte('emission_date', startDate).lte('emission_date', endDate);
            }

            // Apply precise asset asset filter allocations
            if (filterId && filterId !== 'all') {
                const lowerFilter = filterId.toLowerCase();
                if (lowerFilter === 'filter_flight') {
                    logsQuery = logsQuery.eq('category_display', 'flight');
                } else if (lowerFilter === 'filter_shipping') {
                    logsQuery = logsQuery.eq('category_display', 'shipping');
                } else if (lowerFilter === 'filter_electricity') {
                    logsQuery = logsQuery.eq('category_display', 'electricity');
                } else if (lowerFilter === 'filter_gas') {
                    logsQuery = logsQuery.eq('category_display', 'gas');
                } else {
                    // Otherwise it is a direct vehicle UUID key index targeting a specific fleet asset
                    logsQuery = logsQuery.eq('vehicle_id', filterId);
                }
            }
        }

        // Enforce consistent chronological sorting descending
        logsQuery = logsQuery.order('emission_date', { ascending: false });

        const { data: logs, error: logsError } = await logsQuery;
        if (logsError) throw logsError;

        // Compile contextual subheadings based on selection state parameters
        let subtitleRangeContext = 'CONSOLIDATED ENTERPRISE HISTORICAL COMPLIANCE RECORD SUMMARY';
        if (exportType === 'bulk' && startDate && endDate) {
            let entityLabel = 'ALL RECORDED TRANSACTIONS';
            const lowerFilter = filterId.toLowerCase();
            if (lowerFilter === 'filter_flight') entityLabel = 'AVIATION SECTOR ONLY';
            else if (lowerFilter === 'filter_shipping') entityLabel = 'CARGO SHIPPING ONLY';
            else if (lowerFilter === 'filter_electricity') entityLabel = 'GRID UTILITIES ONLY';
            else if (lowerFilter === 'filter_gas') entityLabel = 'GAS COMBUSTION ACCOUNTS ONLY';
            else if (filterId !== 'all') entityLabel = `ASSET REF ID [${filterId.substring(0, 8)}]`;

            subtitleRangeContext = `AUDIT FILTER RANGE: ${startDate} TO ${endDate} | TARGET: ${entityLabel}`;
        } else if (exportType === 'single') {
            subtitleRangeContext = `SINGLE TRANSACTION AUDIT PACKET RECOVERY VERIFICATION SHEET`;
        }

        // Compiles your white clean layout report using the properly sliced logs array context
        const pdfBuffer = await buildCompliancePdfBuffer(profile, logs || [], subtitleRangeContext);

        // 2. DYNAMIC SINGLE ATTACHMENT ANALYTICS: Extract metadata parameters safely from array index 0
        if (!bypassUsage) {
            const hasSingleLog = exportType === 'single' && logs && logs.length > 0;
            const targetLogNode = hasSingleLog ? logs[0] : null;

            // Normalized lowercase filter asset identifier string formatting logic
            const finalizedAssetId = hasSingleLog
                ? (targetLogNode.vehicle_id || `filter_${(targetLogNode.category_display || '').toLowerCase()}`)
                : filterId.toLowerCase();

            const finalizedDateString = hasSingleLog
                ? targetLogNode.emission_date
                : null;

            await supabaseAdmin.from('ecoroute_export_history').insert({
                user_id: userId,
                export_type: exportType,
                target_log_id: exportType === 'single' ? logId : null,
                filter_asset_id: finalizedAssetId,
                start_date: exportType === 'single' ? finalizedDateString : (startDate || null),
                end_date: exportType === 'single' ? finalizedDateString : (endDate || null),
                delivery_channel: 'local_download',
                recipient_email: profile?.email || null,
                delivery_provider: null,
                system_message_id: null
            });
        }

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
