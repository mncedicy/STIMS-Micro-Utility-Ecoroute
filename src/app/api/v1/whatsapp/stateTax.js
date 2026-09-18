// src/app/api/v1/whatsapp/stateTax.js

import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { emailPdfReport } from '@/app/actions/email';

export async function handleTaxWorkflow({ lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState, incomingServerUrl, pendingPayload }) {
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // STEP 2: EMAIL EXPORT DISPATCH RUN
    if (currentState === 'AWAITING_TAX_REPORT_ACTION') {
        const choice = lowerMessage.trim();
        if (choice === '1' || choice === 'action_email_pdf') {
            const payload = pendingPayload || tokenRecord?.pending_whatsapp_payload || {};
            const startDate = payload.startDate;
            const endDate = payload.endDate;
            const targetEmail = userProfile?.email || '';

            console.log("📡 Server Host Context URL : NATIVE_SERVER_ACTION", " | 👤 UserProfile:", userProfile, " | 📅 Start Date:", startDate, " | 📅 End Date:", endDate);

            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

            if (!targetEmail) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Preparing your document package... Dispatching secure audit trail spreadsheet down to: *${targetEmail}*`);

            try {
                const result = await emailPdfReport(targetEmail, 'BATCH_INDEX_SET_WHATSAPP', 'all', { startDate, endDate, filterId: "all", userId: userProfile.id });
                if (result && result.success) {
                    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `✅ Success! Your signed SARS compliance PDF documentation report has been generated and transmitted smoothly.`);
                } else {
                    throw new Error(result?.error || 'Rejected by server agent.');
                }
            } catch (err) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Export Timeout: Failed to process backend report trigger generation loop (${err.message}).`);
            }
            return true;
        }
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // FIXED: PARSE AND INITIALIZE NATIVE LIST MESSAGES FOR SARS COMPLIANCE PERIODS
    // =========================================================================
    if (currentState === 'AWAITING_TAX_PERIOD') {
        const choice = lowerMessage.trim();

        // Map the new incoming button IDs safely onto numerical choices for calculation processing
        const choiceMapping = { "tax_opt_1": "1", "tax_opt_2": "2", "tax_opt_3": "3", "tax_opt_4": "4", "tax_opt_5": "5", "tax_opt_6": "6" };
        const resolvedChoice = choiceMapping[choice] || choice;

        if (!['1', '2', '3', '4', '5', '6'].includes(resolvedChoice)) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid option. Please use the menu buttons panel below to select an approved audit calendar window.");
            return true;
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        let startDate = new Date(today), endDate = new Date(today), label = '';

        if (resolvedChoice === '1') { startDate.setMonth(today.getMonth() - 1); label = '1 Month (SARS Audit Cycle)'; }
        else if (resolvedChoice === '2') { startDate.setMonth(today.getMonth() - 3); label = '3 Months (Quarterly Variance)'; }
        else if (resolvedChoice === '3') { startDate.setMonth(today.getMonth() - 6); label = '6 Months (Half-Year Compliance)'; }
        else if (resolvedChoice === '4') { startDate.setFullYear(today.getFullYear() - 1); label = '12 Months (Rolling Ledger)'; }
        else if (resolvedChoice === '5') {
            const startYear = currentMonth >= 2 ? currentYear : currentYear - 1;
            startDate = new Date(startYear, 2, 1, 0, 0, 0, 0);
            label = `Current Tax Year (${startYear}/${startYear + 1})`;
        } else if (resolvedChoice === '6') {
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

        // FIXED: Render the tax summary text card alongside native touch buttons triggers for actions 
        const taxSummaryPayload = {
            type: "button",
            body: {
                text: `🏛️ *SARS CARBON TAX AUDIT REPORT* 🏛️\n\n• *Period:* ${label}\n• *Window Start:* ${startIso}\n• *Window End:* ${endIso}\n\n` +
                    `📊 *COMPILED SOURCE LEDGER CONTEXT*:\n• Total Rows Analyzed: *${totalEntries} entries*\n• Total Carbon Weight: *${totalKg.toFixed(2)} KG*\n• Metric Tonnes (MT): *${totalMt.toFixed(4)} MT*\n\n` +
                    `⚖️ *VERIFIED AUDIT INPUT BOUNDS*:\n• Statutory Base Rate: *R190.00 / tonne*\n• Basic Free Allowance: *60%*\n• Taxable Carbon Mass: *${taxableVolumeMt.toFixed(4)} MT*\n• *Total Accrued Liability: R ${accruedLiabilityZar.toFixed(2)} ZAR*`
            },
            action: {
                buttons: [
                    { type: "reply", reply: { id: "action_email_pdf", title: "📧 Email PDF Report" } }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, taxSummaryPayload);
        return true;
    }

    // FIXED: Initial sub-menu trigger dispatches a clean native selection list menu sheet parameters object 
    if (lowerMessage === '3') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_TAX_PERIOD', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

        const nativeTaxList = {
            type: "list",
            header: { type: "text", text: "SARS Compliance Audit Periods" },
            body: { text: "Select a statutory financial time-window frame from the menu panel below to compute accumulated carbon levy liabilities:" },
            action: {
                button: "Choose Period",
                sections: [
                    {
                        title: "SARS STANDARD TIMEFRAMES",
                        rows: [
                            { id: "tax_opt_1", title: "One Month", description: "SARS Standard Monthly Audit Cycle" },
                            { id: "tax_opt_2", title: "Three Months", description: "Quarterly Corporate Review Window" },
                            { id: "tax_opt_3", title: "Six Months", description: "Half-Year Statutory Assessment Period" },
                            { id: "tax_opt_4", title: "12 Months", description: "Annual Rolling Enterprise Carbon Ledger" },
                            { id: "tax_opt_5", title: "Current Tax Year", description: "Dynamic financial period starting March 1st" },
                            { id: "tax_opt_6", title: "Previous Tax Year", description: "Finalized audited SARS financial period" }
                        ]
                    }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeTaxList);
        return true;
    }


    return false;
}
