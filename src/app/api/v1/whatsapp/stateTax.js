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

        // Reset conversation states cleanly
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Querying secure statutory ledgers for period: ${label}...`);

        // FIXED: Swapped query targets cleanly to public.ecoroute_emissions_logs table
        // FIXED: Replaced created_at filters with emission_date checks
        // FIXED: Added an explicit condition array check for print_status === 'included'
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

        const taxSummaryCard =
            `🏛️ *SARS CARBON TAX AUDIT REPORT* 🏛️\n\n` +
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
            `ℹ️ _To download complete signed Excel audit trails for this window, visit your web dashboard interface._`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, taxSummaryCard);
        return true;
    }

    return false;
}
