// src/app/api/v1/whatsapp/stateTax.js

import { sendMetaWhatsappMessage } from './metaClient';

export async function handleTaxWorkflow({ lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState, incomingServerUrl, pendingPayload }) {
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    if (currentState === 'AWAITING_TAX_REPORT_ACTION') {
        if (lowerMessage.trim() === '1') {
            const payload = pendingPayload || tokenRecord?.pending_whatsapp_payload || {};
            const startDate = payload.startDate;
            const endDate = payload.endDate;
            const targetEmail = userProfile?.email || '';

            // COMBINED DIAGNOSTIC LOGS
            console.log("📡 Server Host Context URL :", incomingServerUrl, " | 👤 UserProfile Entity Meta :", userProfile, " | 📅 Extracted Start Date :", startDate, " | 📅 Extracted End Date :", endDate);

            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

            if (!targetEmail) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Preparing your document package... Dispatching secure audit trail spreadsheet down to: *${targetEmail}*`);

            try {
                const hostUrl = incomingServerUrl || 'https://stims.co.za';
                let targetDownloadUrl = `${hostUrl}/api/export/pdf?userId=${userProfile.id}&exportType=bulk&startDate=${startDate}&endDate=${endDate}&filterId=all&bypassUsage=true`;

                const apiRes = await fetch(targetDownloadUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                if (apiRes.ok) {
                    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `✅ Success! Your signed SARS compliance PDF documentation report has been generated and transmitted smoothly.`);
                } else {
                    throw new Error(`Status: ${apiRes.status}`);
                }
            } catch (err) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Export Timeout: Failed to process backend report trigger generation loop (${err.message.includes('404') ? '404' : 'Network Error'}).`);
            }
            return true;
        }
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    if (currentState === 'AWAITING_TAX_PERIOD') {
        const choice = lowerMessage.trim();
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

        const { data: logs } = await supabaseAdmin.from('ecoroute_emissions_logs').select('carbon_kg').eq('user_id', userProfile.id).eq('print_status', 'included').gte('emission_date', startIso).lte('emission_date', endIso);
        const totalEntries = logs?.length || 0;
        const totalKg = (logs || []).reduce((sum, row) => sum + parseFloat(row.carbon_kg || 0), 0);
        const totalMt = totalKg / 1000;
        const taxableVolumeMt = totalMt * 0.40, accruedLiabilityZar = taxableVolumeMt * 190;

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
