// src/app/api/v1/whatsapp/stateElectricity.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleElectricityWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {
    if (currentState === 'AWAITING_POWER_SOURCE') {
        const choice = lowerMessage.trim();
        const sourcesMap = { "1": "utility_grid", "2": "diesel_generator", "3": "solar_pv" };
        const selectedSource = sourcesMap[choice] || 'utility_grid';

        const finalKwh = pendingPayload?.kwh;
        const finalCountry = pendingPayload?.country_code;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing Scope 2 electricity footprint calculations...`);

        const form = { type: 'electricity', kwh: finalKwh.toString(), country_code: finalCountry, power_source: selectedSource, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('electricity', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'electricity', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Electricity Grid (${finalCountry})`, `${finalKwh} kWh (${selectedSource})`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_POWER_COUNTRY') {
        const countryCode = lowerMessage.trim().toUpperCase();
        if (countryCode.length !== 2) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid format. Please supply a 2-letter ISO country code (e.g., ZA):");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_POWER_SOURCE', pending_whatsapp_payload: { ...pendingPayload, country_code: countryCode } })
            .eq('id', tokenRecord.id);

        const sourcePrompt =
            `⚡ *SELECT ELECTRICITY GENERATION SOURCE* ⚡\n\n` +
            `Reply with an option item index:\n\n` +
            `*1* — National Utility Grid\n` +
            `*2* — Commercial Standby Diesel Generator\n` +
            `*3* — Solar PV / Green Renewable Offset`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, sourcePrompt);
        return true;
    }

    if (currentState === 'AWAITING_POWER_KWH') {
        const numericKwh = parseFloat(lowerMessage);
        if (isNaN(numericKwh) || numericKwh <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical energy consumption value in kWh:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_POWER_COUNTRY', pending_whatsapp_payload: { kwh: numericKwh } })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY RUN METRICS*\n\nPlease specify the target grid region location:\n\n*ISO COUNTRY CODE (e.g., ZA)*");
        return true;
    }

    if (lowerMessage === '4') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_POWER_KWH' }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
        return true;
    }

    return false;
}
