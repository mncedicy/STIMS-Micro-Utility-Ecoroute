// src/app/api/v1/whatsapp/stateElectricity.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
// FIXED: Added the complete native client messaging and interactive UI components import decorators cleanly
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleElectricityWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // Global escape hatches to main menu control panel layer
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 3: USER SELECTED POWER SOURCE MIX NETWORK TYPE (UTILITY GRID ETC.)
    // =========================================================================
    if (currentState === 'AWAITING_POWER_SOURCE') {
        const choice = lowerMessage.trim().toLowerCase();

        const sourcesMap = {
            "pwr_src_1": "utility_grid",
            "pwr_src_2": "diesel_generator",
            "pwr_src_3": "solar_pv",
            // Backward compatibility
            "1": "utility_grid", "2": "diesel_generator", "3": "solar_pv"
        };

        const selectedSource = sourcesMap[choice];
        if (!selectedSource) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Please use the menu picker panel to choose an approved generation source.");
            return true;
        }

        const finalKwh = pendingPayload?.kwh;
        const finalCountry = pendingPayload?.country_code;

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing Scope 2 electricity grid metrics conversion run...`);

        const form = { type: 'electricity', kwh: finalKwh.toString(), country_code: finalCountry, power_source: selectedSource, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('electricity', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'electricity', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Electricity Grid (${finalCountry})`, `${finalKwh} kWh (${selectedSource.toUpperCase()})`, payload, usageCap, currentUsage));
        return true;
    }

    // =========================================================================
    // STEP 2: USER SUPPLIED COUNTRY ISO REGINATION CODE (e.g. ZA)
    // =========================================================================
    if (currentState === 'AWAITING_POWER_COUNTRY') {
        const countryIso = lowerMessage.trim().toUpperCase();
        if (countryIso.length !== 2) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid region identifier. Please provide a standard 2-letter country ISO code (e.g. ZA or US):");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_POWER_SOURCE',
            pending_whatsapp_payload: { ...pendingPayload, country_code: countryIso }
        }).eq('id', tokenRecord.id);

        const nativePowerListPayload = {
            type: "list",
            header: { type: "text", text: "⚡ SELECT POWER SOURCE ⚡" },
            body: { text: "Choose an active generation source option parameter from the panel matrix row list down below to process calculations:" },
            action: {
                button: "Select Source Mix",
                sections: [
                    {
                        title: "GENERATION UTILITIES",
                        rows: [
                            { id: "pwr_src_1", title: "National Grid", description: "Standard utility grid distribution lines" },
                            { id: "pwr_src_2", title: "Diesel Generator", description: "Stationary combustion back-up units" },
                            { id: "pwr_src_3", title: "Solar PV Arrays", description: "Exempt clean renewable infrastructure panels" }
                        ]
                    }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativePowerListPayload);
        return true;
    }

    // =========================================================================
    // STEP 1: USER SUPPLIED POWER CONSUMPTION QUANTITY VOLUME (KWH)
    // =========================================================================
    if (currentState === 'AWAITING_POWER_KWH') {
        const numericKwh = parseFloat(lowerMessage);
        if (isNaN(numericKwh) || numericKwh <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numeric energy volume consumption amount in kWh:");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_POWER_COUNTRY',
            pending_whatsapp_payload: { kwh: numericKwh }
        }).eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY REGIONAL METRICS*\n\nPlease specify the 2-letter country location code:\n\n*COUNTRY ISO CODE (e.g. ZA)*");
        return true;
    }

    // =========================================================================
    // INITIAL GATES INBOUND TRIGGERS MAPPING FROM SUB-MENU BUTTON CALLBACKS
    // =========================================================================
    if (lowerMessage === 'calc_opt_4' || lowerMessage === '4') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_POWER_KWH',
            pending_whatsapp_payload: {}
        }).eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
        return true;
    }

    return false;
}
