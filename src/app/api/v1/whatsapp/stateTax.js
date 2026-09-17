// src/app/api/v1/whatsapp/stateTax.js

import { sendMetaWhatsappMessage } from './metaClient';

/**
 * Computes date ranges dynamically based on the current server year 
 * and queries the custom ecoroute compliance ledger table layout blocks.
 */
export async function handleTaxWorkflow({ lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState }) {

    // Check escape hatches to main menu
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim())) {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 2: PARSE SECONDARY CHOICE USER SELECTION INPUT (EMAIL REQUEST PROCESSING)
    // =========================================================================
    if (currentState === 'AWAITING_TAX_REPORT_ACTION') {
        const choice = lowerMessage.trim();

        if (choice === '1') {
            const payload = tokenRecord?.pending_whatsapp_payload || {};
            const startDate = payload.startDate;
            const endDate = payload.endDate;
            const targetEmail = userProfile?.email || '';

            // Reset conversation states cleanly right before executing network fetch routines
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            if (!targetEmail) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Preparing your document package... Dispatching secure audit trail spreadsheet down to: *${targetEmail}*`);

            try {
                // Dynamically compile target endpoint parameters matrix context
                const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stims.co.za';
                let targetDownloadUrl = `${hostUrl}/api/export/pdf?userId=${userProfile.id}`;
                targetDownloadUrl += `&exportType=bulk&startDate=${startDate}&endDate=${endDate}&filterId=all`;

                // Fire microservice fetch trigger request safely down internal gateway pipeline layers
                const apiRes = await fetch(targetDownloadUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (apiRes.ok) {
                    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `✅ Success! Your signed SARS compliance PDF documentation report has been generated and transmitted smoothly.`);
                } else {
                    throw new Error(`Export service responded with status: ${apiRes.status}`);
                }
            } catch (err) {
                console.error(`🚨 [Tax Export Pipeline Failure]:`, err.message);
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Export Timeout: Failed to process backend report trigger generation loop (${err.message}).`);
            }
            return true;
        }

        // If an unmatched command comes in, clear state parameters and redirect back safely
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 1: INITIAL COMPLIANCE WINDOW TIME-FRAME SELECTION INPUT NODES
    // =========================================================================
    if (currentState === 'AWAITING_TAX_PERIOD') {
        const choice = lowerMessage.trim();
        const validChoices = ['1', '2', '3', '4', '5', '6'];

        if (!validChoices.includes(choice)) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid option. Please reply with a number between 1 and 6 to extract your tax audit ledger report.");
            return true;
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed (2 = March)

        let startDate = new Date(today);
        let endDate = new Date(today);
        let label = '';

        if (choice === '1') {
            startDate.setMonth(today.getMonth() - 1);
            label = '1 Month (SARS Audit Cycle)';
        } else if (choice === '2') {
            startDate.setMonth(today.getMonth() - 3);
            label = '3 Months (Quarterly Variance)';
        } else if (choice === '3') {
            startDate.setMonth(today.getMonth() - 6);
            label = '6 Months (Half-Year Compliance)';
        } else if (choice === '4') {
            startDate.setFullYear(today.getFullYear() - 1);
            label = '12 Months (Rolling Ledger)';
        } else if (choice === '5') {
            const startYear = currentMonth >= 2 ? currentYear : currentYear - 1;
            startDate = new Date(startYear, 2, 1, 0, 0, 0, 0); // March 1st
            const taxYearEndLabel = startYear + 1;
            label = `Current Tax Year (${startYear}/${taxYearEndLabel})`;
        } else if (choice === '6') {
            const baseYear = currentMonth >= 2 ? currentYear : currentYear - 1;
            const prevStartYear = baseYear - 1;

            startDate = new Date(prevStartYear, 2, 1, 0, 0, 0, 0); // March 1st
            endDate = new Date(baseYear, 1, 28, 23, 59, 59, 999);  // Feb 28th

            if (baseYear % 4 === 0 && (baseYear % 100 !== 0 || baseYear % 400 === 0)) {
                endDate.setDate(29);
            }

            label = `Previous Tax Year (${prevStartYear}/${baseYear})`;
        }

        const startIso = startDate.toISOString().split('T')[0];
        const endIso = endDate.toISOString().split('T')[0];

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Querying secure statutory ledgers for period: ${label}...`);

        const { data: logs, error } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('carbon_kg')
            .eq('user_id', userProfile.id)
            .eq('print_status', 'included')
            .gte('emission_date', startIso)
            .lte('emission_date', endIso);

        if (error) {
            console.error('🚨 Supabase Emissions Logs Query Error:', error.message);
        }

        const totalEntries = logs?.length || 0;
        const totalKg = (logs || []).reduce((sum, row) => sum + parseFloat(row.carbon_kg || 0), 0);
        const totalMt = totalKg / 1000;

        const taxableVolumeMt = totalMt * 0.40;
        const accruedLiabilityZar = taxableVolumeMt * 190;

        // FIXED: Shift conversation checkpoint flag forward into dynamic actions menu mode context pool
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_whatsapp_state: 'AWAITING_TAX_REPORT_ACTION',
                pending_whatsapp_payload: { startDate: startIso, endDate: endIso }
            })
            .eq('id', tokenRecord.id);

        const taxSummaryCard =
            `🏛 *SARS CARBON TAX AUDIT REPORT* 🏛\n\n` +
            `• *Period:* ${label}\n` +
            `• *Window Start:* ${startIso}\n` +
            `• *Window End:* ${endIso}\n\n` +
            `📊 *COMPILED SOURCE LEDGER CONTEXT*:\n` +
            `• Total Rows Analyzed: *${totalEntries} entries*\n` +
            `• Total Carbon Weight: *${totalKg.toFixed(2)} KG*\n` +
            `• Metric Tonnes (MT): *${totalMt.toFixed(4)} MT*\n\n` +
            `⚖️ *VERIFIED AUDIT INPUT BOUNDS*:\n` +
            `• Statutory Base Rate: *R190.00 / tonne*\n` +
            `• Basic Free Allowance: *60%*\n` +
            `• Taxable Carbon Mass: *${taxableVolumeMt.toFixed(4)} MT*\n` +
            `• *Total Accrued Liability: R ${accruedLiabilityZar.toFixed(2)} ZAR*\n\n` +
            `👉 *REPORT OPTIONS*:\n` +
            `1. Email PDF Report\n\n` +
            `🔢 _Reply with *1* to send this document compilation straight to your inbox trail folder context rules._`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, taxSummaryCard);
        return true;
    }

    return false;
}
