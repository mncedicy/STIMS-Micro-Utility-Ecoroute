// src/app/api/v1/whatsapp/stateShipping.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleShippingWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {
    if (currentState === 'AWAITING_SHIPPING_MODE') {
        const choice = lowerMessage.trim();
        const modesMap = { "1": "road_heavy", "2": "road_light", "3": "rail", "4": "ocean" };
        const selectedMode = modesMap[choice] || 'standard';

        const finalWeight = pendingPayload?.cargo_weight;
        const finalDistance = pendingPayload?.distance;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing logistics emissions footprint metrics...`);

        const form = { type: 'shipping', cargo_weight: finalWeight.toString(), mass_unit: 'tonnes', distance: finalDistance.toString(), unit: 'km', shipping_mode: selectedMode, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('shipping', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'shipping', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Freight Logistics: ${selectedMode.toUpperCase()}`, `${finalWeight} Tonnes across ${finalDistance} KM`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_SHIPPING_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid distance entry. Please input a positive numeric travel path amount in KM:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_SHIPPING_MODE', pending_whatsapp_payload: { ...pendingPayload, distance: numericDistance } })
            .eq('id', tokenRecord.id);

        const modePrompt =
            `📦 *SELECT FREIGHT LOGISTICS TRANSPORT MODE* 📦\n\n` +
            `Reply with a single option key index to map calculations:\n\n` +
            `*1* — Linehaul Truck (Road Heavy)\n` +
            `*2* — Urban Delivery Van (Road Light)\n` +
            `*3* — Transnet Freight Network (Rail)\n` +
            `*4* — Deep Sea Cargo Vessel (Ocean)`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, modePrompt);
        return true;
    }

    if (currentState === 'AWAITING_SHIPPING_WEIGHT') {
        const numericWeight = parseFloat(lowerMessage);
        if (isNaN(numericWeight) || numericWeight <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical cargo weight parameter amount:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_SHIPPING_DISTANCE', pending_whatsapp_payload: { cargo_weight: numericWeight } })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING DISPATCH DETAILS*\n\nPlease specify total cargo transport length:\n\n*DISTANCE (KM)*");
        return true;
    }

    return false;
}
