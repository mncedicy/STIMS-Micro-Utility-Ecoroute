// /src/app/actions/email.js
"use server";

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateComplianceEmailHtml } from '../utils/emailTemplateEngine';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const destinationEmail = process.env.FORWARD_DESTINATION_EMAIL;

// Safe administrative bypass client instance
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Securely emails fully structured jsPDF carbon audit documents straight to the user
 */
export async function emailPdfReport(userEmail, logId, categoryDisplay, payloadEnvelope) {
    if (!resend) {
        return { success: false, error: "Email delivery system is not configured." };
    }

    const finalTargetEmailAddress = userEmail;
    if (!finalTargetEmailAddress) {
        return { success: false, error: "No target email address has been provided." };
    }

    try {
        const displayId = logId?.startsWith('BATCH_INDEX_SET_') ? 'BULK_BATCH' : logId.substring(0, 8);
        const currentLocalDate = new Date().toLocaleDateString('en-ZA');

        const startDate = payloadEnvelope?.startDate || "2026-08-01";
        const endDate = payloadEnvelope?.endDate || "2026-08-31";

        // FIXED UUID TARGETING: Bypasses string substitution splits on logId 
        // to read the uncorrupted user account UUID directly from the envelope parameter payload
        const targetSearchUserId = payloadEnvelope?.userId;

        if (!targetSearchUserId) {
            return { success: false, error: "Target user identification parameter could not be resolved." };
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
            .eq('user_id', targetSearchUserId)
            .order('emission_date', { ascending: false });

        // FIXED FILTER APPLIED: If month window boundaries are passed from the UI, trim data logs before generating the PDF file buffer
        if (startDate && endDate) {
            logsQuery = logsQuery.gte('emission_date', startDate).lte('emission_date', endDate);
        }

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

        const emailPayload = {
            from: 'EcoRoute <noreply@stims.co.za>',
            to: [finalTargetEmailAddress.trim().toLowerCase()],
            subject: `Stims EcoRoute Compliance Audit Report Update`,
            html: compiledHtmlContent
        };

        const rawBase64DataString = payloadEnvelope?.data;
        if (rawBase64DataString) {
            emailPayload.attachments = [
                {
                    filename: `ecoroute_compliance_report_${displayId}.pdf`,
                    content: Buffer.from(rawBase64DataString, 'base64'),
                    contentType: 'application/pdf'
                }
            ];
        }

        await resend.emails.send(emailPayload);
        return { success: true, message: "The identical PDF report file has been emailed successfully!" };
    } catch (err) {
        console.error('[Resend Email Action Exception]:', err);
        return { success: false, error: err.message || "Failed to deliver the email report." };
    }
}
