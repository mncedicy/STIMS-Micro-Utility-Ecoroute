// src/app/api/v1/whatsapp/stateTax.js

import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { emailPdfReport } from '@/app/actions/email';
import { compileTaxLedgerReport } from './taxCalculations';

/**
 * Handles conversational routing steps for the SARS carbon compliance audit tracker wizards.
 */
export async function handleTaxWorkflow(contextPayload) {
    const { lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState, pendingPayload } = contextPayload;
    const choice = String(lowerMessage || '').trim().toLowerCase();

    // Main Menu global escape hatches
    if (['menu', 'main menu', 'exit', 'cancel'].includes(choice)) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 2: NATIVE EMAIL TRIGGER DISPATCH (SERVER ACTION RUN)
    // =========================================================================
    if (currentState === 'AWAITING_TAX_REPORT_ACTION' || choice === 'action_email_pdf') {
        if (choice === '1' || choice === 'action_email_pdf') {
            const payload = pendingPayload || tokenRecord?.pending_whatsapp_payload || {};
            const { startDate, endDate } = payload;
            const targetEmail = userProfile?.email || '';

            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

            if (!targetEmail) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Preparing your document package... Dispatching secure audit trail spreadsheet down to: *${targetEmail}*`);

            try {
                const result = await emailPdfReport(targetEmail, 'BATCH_INDEX_SET_WHATSAPP', 'all', { startDate, endDate, filterId: "all", userId: userProfile.id });
                if (result?.success) {
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
    // STEP 1: CALCULATE COMPLIANCE DATA OVER SELECTED WINDOW TIMEFRAME
    // =========================================================================
    if (currentState === 'AWAITING_TAX_PERIOD' || ['1', '2', '3', '4', '5', '6', 'tax_opt_1', 'tax_opt_2', 'tax_opt_3', 'tax_opt_4', 'tax_opt_5', 'tax_opt_6'].includes(choice)) {

        // Outsource processing data manipulation calculations to the clean dedicated module
        const report = await compileTaxLedgerReport(choice, userProfile.id, supabaseAdmin);

        if (!report.success) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid option. Please use the menu buttons panel below to select an approved audit calendar window.");
            return true;
        }

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Querying secure statutory ledgers for period: ${report.label}...`);

        let promptBodyText = `🏛️ *SARS CARBON TAX AUDIT REPORT* 🏛️\n\n` +
            `• *Period:* ${report.label}\n` +
            `• *Window Start:* *${report.startIso}*\n` +
            `• *Window End:* *${report.endIso}*\n\n` +
            `📊 *COMPILED SOURCE LEDGER CONTEXT*:\n` +
            `• Total Rows Analyzed: *${report.totalEntries} entries*\n` +
            `• Total Carbon Weight: *${report.totalKg.toFixed(2)} KG*\n` +
            `• Metric Tonnes (MT): *${report.totalMt.toFixed(4)} MT*\n\n` +
            `⚖️ *VERIFIED AUDIT INPUT BOUNDS*:\n` +
            `• Statutory Base Rate: *R190.00 / tonne*\n` +
            `• Basic Free Allowance: *60%*\n` +
            `• Taxable Carbon Mass: *${report.taxableVolumeMt.toFixed(4)} MT*\n` +
            `• *Total Accrued Liability: R ${report.accruedLiabilityZar.toFixed(2)} ZAR*`;

        // FIXED: Conditional evaluation hides button array elements when entries count equals zero
        if (report.totalEntries === 0) {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            promptBodyText += `\n\nℹ️ _No transaction logs recorded inside this specific calendar window frame. Export disabled._`;
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, promptBodyText);
            return true;
        }

        // Lock database row parameters state ahead of button elements interactive distribution
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_TAX_REPORT_ACTION',
            pending_whatsapp_payload: { startDate: report.startIso, endDate: report.endIso }
        }).eq('id', tokenRecord.id);

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, {
            type: "button",
            body: { text: promptBodyText },
            action: { buttons: [{ type: "reply", reply: { id: "action_email_pdf", title: "📧 Email PDF Report" } }] }
        });
        return true;
    }

    // =========================================================================
    // INITIAL ACCESSIBILITY HUB OPEN SELECTION TRIGGER CARD
    // =========================================================================
    if (choice === 'calc_opt_3' || choice === '3') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_TAX_PERIOD', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, {
            type: "list",
            header: { type: "text", text: "SARS Compliance Audit Periods" },
            body: { text: "Select a statutory financial time-window frame from the menu panel below to compute accumulated carbon levy liabilities:" },
            action: {
                button: "Choose Period",
                sections: [{
                    title: "SARS TIMEFRAMES",
                    rows: [
                        { id: "tax_opt_1", title: "One Month", description: "SARS Standard Monthly Audit Cycle" },
                        { id: "tax_opt_2", title: "Three Months", description: "Quarterly Corporate Review Window" },
                        { id: "tax_opt_3", title: "Six Months", description: "Half-Year Statutory Assessment Period" },
                        { id: "tax_opt_4", title: "12 Months", description: "Annual Rolling Enterprise Carbon Ledger" },
                        { id: "tax_opt_5", title: "Current Tax Year", description: "Dynamic financial period starting March 1st" },
                        { id: "tax_opt_6", title: "Previous Tax Year", description: "Finalized audited SARS financial period" }
                    ]
                }]
            }
        });
        return true;
    }

    return false;
}
