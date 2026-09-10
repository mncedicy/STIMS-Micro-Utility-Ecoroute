// src/app/actions/email.js

"use server";

import { createClient } from '@supabase/supabase-js';
import { generateComplianceEmailHtml } from '../utils/emailTemplateEngine';
import { sendSystemNotification } from '../utils/emailEngine';
import { buildCompliancePdfBuffer } from '../api/export/pdf/pdfGeneratorService';
import { updateUsage } from '../utils/dispatch/tokenHelpers';

// Safe administrative bypass client instance
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Securely emails fully structured jsPDF carbon audit documents straight to the user 
 * via the automated primary (Resend) -> fallback (Brevo SMTP) notification engine.
 */
export async function emailPdfReport(userEmail, logId, categoryDisplay, payloadEnvelope) {
    const finalTargetEmailAddress = userEmail;
    if (!finalTargetEmailAddress) {
        return { success: false, error: "No target email address has been provided." };
    }

    try {
        const isBulk = logId?.startsWith('BATCH_INDEX_SET_');
        const displayId = isBulk ? 'BULK_BATCH' : logId.substring(0, 8);
        const currentLocalDate = new Date().toLocaleDateString('en-ZA');

        const startDate = payloadEnvelope?.startDate || "2026-08-01";
        const endDate = payloadEnvelope?.endDate || "2026-08-31";
        const filterId = payloadEnvelope?.filterId || "all";

        // Read the uncorrupted user account UUID directly from the envelope parameter payload
        const targetSearchUserId = payloadEnvelope?.userId;

        if (!targetSearchUserId) {
            return { success: false, error: "Target user identification parameter could not be resolved." };
        }

        // 1. CHARGE USAGE HERE FIRST: Primary user intent gate handles subtraction natively
        const usageResult = await updateUsage(targetSearchUserId, 1);
        if (usageResult.exceeded) {
            return { success: false, error: `⚠️ Rate limit or usage cap exceeded: ${usageResult.message}` };
        }

        // Fetch corresponding user corporate profile details
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', targetSearchUserId)
            .maybeSingle();

        if (profileError) console.warn(`[Profile Lookup Warning]: ${profileError.message}`);

        // Target emissions log table ledger rows
        let logsQuery = supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('*')
            .eq('user_id', targetSearchUserId);

        // ENHANCED GRANULAR FILTER ENGINE FOR EMAIL PDF GENERATION
        if (!isBulk && logId) {
            logsQuery = logsQuery.eq('id', logId);
        } else {
            // Trim data logs by calendar boundary windows
            if (startDate && endDate) {
                logsQuery = logsQuery.gte('emission_date', startDate).lte('emission_date', endDate);
            }

            // Trim data logs by selected specific structural branch or asset indices
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
                    logsQuery = logsQuery.eq('vehicle_id', filterId);
                }
            }
        }

        // Enforce consistent sorting criteria array bounds
        logsQuery = logsQuery.order('emission_date', { ascending: false });

        const { data: logs, error: logsError } = await logsQuery;
        if (logsError) throw logsError;

        // Run linear sum reduction operations across the data logs context array
        let totalKg = 0;
        let fleetTotal = 0;
        let flightTotal = 0;
        let shippingTotal = 0;
        let powerUtilitiesTotal = 0;
        const totalRecordsCount = logs ? logs.length : 0;

        if (logs) {
            logs.forEach(log => {
                const kgVal = parseFloat(log.carbon_kg || 0);
                totalKg += kgVal;

                const cat = (log.category_display || 'VEHICLE').toUpperCase();
                if (cat === 'VEHICLE') fleetTotal += kgVal;
                else if (cat === 'FLIGHT') flightTotal += kgVal;
                else if (cat === 'SHIPPING') shippingTotal += kgVal;
                else if (cat === 'ELECTRICITY' || cat === 'GAS') powerUtilitiesTotal += kgVal;
            });
        }

        const calculatedMetricTons = (totalKg / 1000).toFixed(4);
        const operatorFullLabel = `${profile?.first_name?.toUpperCase() || 'N/A'} ${profile?.surname?.toUpperCase() || ''}`.trim();
        const enterpriseLabel = profile?.company?.toUpperCase() || 'INDEPENDENT CARRIER';

        // Call the external lightweight template engine to get the HTML layout
        const compiledHtmlContent = generateComplianceEmailHtml({
            currentLocalDate,
            operatorFullLabel,
            enterpriseLabel,
            totalRecordsCount,
            startDate,
            endDate,
            totalKg,
            calculatedMetricTons,
            fleetTotal,
            flightTotal,
            shippingTotal,
            powerUtilitiesTotal,
            displayId
        });

        // NATIVE SERVER GENERATION WITH PRECISE CONTEXT ALIGNMENTS
        let subtitleRangeContext = 'CONSOLIDATED ENTERPRISE HISTORICAL COMPLIANCE RECORD SUMMARY';
        if (isBulk && startDate && endDate) {
            let entityLabel = 'ALL RECORDED TRANSACTIONS';
            const lowerFilter = filterId.toLowerCase();
            if (lowerFilter === 'filter_flight') entityLabel = 'AVIATION SECTOR ONLY';
            else if (lowerFilter === 'filter_shipping') entityLabel = 'CARGO SHIPPING ONLY';
            else if (lowerFilter === 'filter_electricity') entityLabel = 'GRID UTILITIES ONLY';
            else if (lowerFilter === 'filter_gas') entityLabel = 'GAS COMBUSTION ACCOUNTS ONLY';
            else if (filterId !== 'all') entityLabel = `ASSET REF ID [${filterId.substring(0, 8)}]`;

            subtitleRangeContext = `AUDIT FILTER RANGE: ${startDate} TO ${endDate} | TARGET: ${entityLabel}`;
        } else if (!isBulk) {
            subtitleRangeContext = `SINGLE TRANSACTION AUDIT PACKET RECOVERY VERIFICATION SHEET`;
        }

        const pdfArrayBuffer = await buildCompliancePdfBuffer(profile, logs || [], subtitleRangeContext);

        const attachments = [
            {
                filename: `ecoroute_compliance_report_${displayId}.pdf`,
                content: Buffer.from(pdfArrayBuffer),
                contentType: 'application/pdf'
            }
        ];

        // Delegate dispatch through the multi-provider failover engine module
        const dispatchResult = await sendSystemNotification({
            from: 'EcoRoute <noreply@stims.co.za>',
            to: [finalTargetEmailAddress.trim().toLowerCase()],
            subject: `Stims EcoRoute Compliance Audit Report Update`,
            html: compiledHtmlContent,
            attachments: attachments
        });

        if (!dispatchResult.success) {
            console.error('[Email Exception]:', dispatchResult);
            throw new Error(dispatchResult.error || "Failed to deliver compliance report via available mail routes.");
        }

        // 2. DYNAMIC SINGLE ATTACHMENT ANALYTICS: Extract metadata parameters safely from array index 0
        const hasSingleLog = !isBulk && logs && logs.length > 0;
        const targetLogNode = hasSingleLog ? logs[0] : null;

        // Force lowercase mapping strings
        const finalizedAssetId = hasSingleLog
            ? (targetLogNode.vehicle_id || `filter_${(targetLogNode.category_display || '').toLowerCase()}`)
            : filterId.toLowerCase();

        const finalizedDateString = hasSingleLog
            ? targetLogNode.emission_date
            : null;

        await supabaseAdmin.from('ecoroute_export_history').insert({
            user_id: targetSearchUserId,
            export_type: isBulk ? 'bulk' : 'single',
            target_log_id: isBulk ? null : logId,
            filter_asset_id: finalizedAssetId,
            start_date: isBulk ? startDate : finalizedDateString,
            end_date: isBulk ? endDate : finalizedDateString,
            delivery_channel: 'email',
            recipient_email: finalTargetEmailAddress.trim().toLowerCase(),
            delivery_provider: dispatchResult.provider || 'unknown',
            system_message_id: dispatchResult.id ? String(dispatchResult.id) : null
        });

        return { success: true, message: "The identical PDF report file has been emailed successfully!" };
    } catch (err) {
        console.error('[Email Action Exception]:', err);
        return { success: false, error: err.message || "Failed to deliver the email report." };
    }
}
