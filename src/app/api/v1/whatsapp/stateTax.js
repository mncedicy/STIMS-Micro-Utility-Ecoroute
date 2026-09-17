// src/app/api/v1/whatsapp/stateTax.js

import { sendMetaWhatsappMessage } from './metaClient';
import { emailPdfReport } from '@/app/actions/email'; // FIXED: Importing your native Server Action directly

export async function handleTaxWorkflow({ lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState, pendingPayload }) {
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 2: PARSE SECONDARY CHOICE USER SELECTION INPUT (EMAIL EXPORT ACTION)
    // =========================================================================
    if (currentState === 'AWAITING_TAX_REPORT_ACTION') {
        const choice = lowerMessage.trim();
        console.log(`🔍 [stateTax Trace] Checking choice selection. Received value: "${choice}"`);

        if (choice === '1') {
            const payload = pendingPayload || tokenRecord?.pending_whatsapp_payload || {};
            const startDate = payload.startDate;
            const endDate = payload.endDate;
            const targetEmail = userProfile?.email || '';

            // Explicit console logging trace block matching your exact output requirements
            console.log("📡 Server Host Context URL : NATIVE_SERVER_ACTION");
            console.log("👤 UserProfile Entity Meta :", userProfile);
            console.log("📅 Extracted Start Date    :", startDate);
            console.log("📅 Extracted End Date      :", endDate);

            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

            if (!targetEmail) {
                console.warn("⚠️ [stateTax Warning] Aborting export. Target email address is completely unassigned.");
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Preparing your document package... Dispatching secure audit trail spreadsheet down to: *${targetEmail}*`);

            try {
                // FIXED: Mirrored the payload envelope requirements from ExportModal.js exactly to guarantee schema consistency
                const payloadEnvelope = {
                    startDate: startDate,
                    endDate: endDate,
                    filterId: "all",
                    userId: userProfile.id
                };

                console.log(`🔗 [stateTax Server Action] Invoking emailPdfReport natively with envelope:`, payloadEnvelope);

                // FIXED: Executing the native server action directly instead of firing a relative/absolute fetch URL
                const result = await emailPdfReport(
                    targetEmail,
                    'BATCH_INDEX_SET_WHATSAPP', // Emulates a batch manifest ID set context to match modal expectations
                    'all',                     // Broad categories display context
                    payloadEnvelope
                );

                if (result && result.success) {
                    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `✅ Success! Your signed SARS compliance PDF documentation report has been generated and transmitted smoothly.`);
                } else {
                    throw new Error(result?.error || 'Email distribution rejected by server agent.');
                }
            } catch (err) {
                console.error(`🚨 [stateTax Core Crash] Exception caught inside server action pipeline:`, err.message);
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Export Timeout: Failed to process backend report trigger generation loop (${err.message}).`);
            }
            return true;
        }
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 1: INITIAL COMPLIANCE WINDOW TIME-FRAME SELECTION INPUT NODES
    // =========================================================================
    if (currentState === 'AWAITING_TAX_PERIOD') {
        const choice = lowerMessage.trim();
        console.log(`🔍 [stateTax Trace] Checking period assignment tag selection entry. Received value: "${choice}"`);

        if (!['1', '2', '3', '4', '5', '6'].includes(choice)) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid option. Please reply with a number between 1 and 6 to extract your tax audit ledger report.");
            return true;
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        let startDate = new Date(today), endDate = new Date(today), label = '';

        if (choice === '1') { startDate.setMonth(today.getMonth() - 1); label = '1 Month (SARS Audit Cycle)'; }
        else if (choice === '2') { startDate.setMonth(today.getMonth() - 3); label = '3 Months (Quarterly Variance)'; }
        else if (choice === '3') { startDate.setMonth(today.getMonth() - 6); label = '6 Months (Half-Year Compliance)'; }
        else if (choice === '4') { startDate.setFullYear(today.getFullYear() - 1); label = '12 Months (Rolling Ledger)'; }
        else if (choice === '5') {
            const startYear = currentMonth >= 2 ? currentYear : currentYear - 1;
            startDate = new Date(startYear, 2, 1, 0, 0, 0, 0);
            label = `Current Tax Year (${startYear}/${startYear + 1})`;
        } else if (choice === '6') {
            const baseYear = currentMonth >= 2 ? currentYear : currentYear - 1;
            startDate = new Date(baseYear - 1, 2, 1, 0, 0, 0, 0);
            endDate = new Date(baseYear, 1, baseYear % 4 === 0 && (baseYear % 100 !== 0 || baseYear % 400 === 0) ? 29 : 28, 23, 59, 59, 999);
            label = `Previous Tax Year (${baseYear - 1}/${baseYear})`;
        }

        const startIso = startDate.toISOString().split('T')[0];
        const endIso = endDate.toISOString().split('T')[0];

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Querying secure statutory ledgers for period: ${label}...`);

        console.log(`📡 [stateTax Database Run] Querying ecoroute_emissions_logs table between dates ${startIso} and ${endIso}...`);
        const { data: logs } = await supabaseAdmin.from('ecoroute_emissions_logs').select('carbon_kg').eq('user_id', userProfile.id).eq('print_status', 'included').gte('emission_date', startIso).lte('emission_date', endIso);

        const totalEntries = logs?.length || 0;
        const totalKg = (logs || []).reduce((sum, row) => sum + parseFloat(row.carbon_kg || 0), 0);
        const totalMt = totalKg / 1000;
        const taxableVolumeMt = totalMt * 0.40, accruedLiabilityZar = taxableVolumeMt * 190;

        console.log(`✅ [stateTax Database Result] Records processed: ${totalEntries} entries | Yielded mass weight volume: ${totalMt.toFixed(4)} MT`);

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_TAX_REPORT_ACTION', pending_whatsapp_payload: { startDate: startIso, endDate: endIso } }).eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `🏛️ *SARS CARBON TAX AUDIT REPORT* 🏛️\n\n• *Period:* ${label}\n• *Window Start:* ${startIso}\n• *Window End:* ${endIso}\n\n` +
            `📊 *COMPILED SOURCE LEDGER CONTEXT*:\n• Total Rows Analyzed: *${totalEntries} entries*\n• Total Carbon Weight: *${totalKg.toFixed(2)} KG*\n• Metric Tonnes (MT): *${totalMt.toFixed(4)} MT*\n\n` +
            `⚖️ *VERIFIED AUDIT INPUT BOUNDS*:\n• Statutory Base Rate: *R190.00 / tonne*\n• Basic Free Allowance: *60%*\n• Taxable Carbon Mass: *${taxableVolumeMt.toFixed(4)} MT*\n• *Total Accrued Liability: R ${accruedLiabilityZar.toFixed(2)} ZAR*\n\n` +
            `👉 *REPORT OPTIONS*:\n1. Email PDF Report\n\n🔢 _Reply with *1* to send this document compilation straight to your inbox._`
        );
        return true;
    }
    return false;
}
