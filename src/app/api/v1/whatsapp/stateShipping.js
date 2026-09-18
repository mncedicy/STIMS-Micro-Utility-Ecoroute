// src/app/api/v1/whatsapp/stateShipping.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleShippingWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // Check escape hatches to main menu
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 3: USER SELECTED A NATIVE FREIGHT LOGISTICS MODE ROW
    // =========================================================================
    if (currentState === 'AWAITING_SHIPPING_MODE') {
        const choice = lowerMessage.trim().toLowerCase();

        const modesMap = {
            "ship_mode_1": "road_heavy",
            "ship_mode_2": "road_light",
            "ship_mode_3": "rail",
            "ship_mode_4": "ocean",
            "1": "road_heavy", "2": "road_light", "3": "rail", "4": "ocean"
        };

        const selectedMode = modesMap[choice];

        if (!selectedMode) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Please use the menu picker panel to choose an approved logistics mode.");
            return true;
        }

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

    // =========================================================================
    // STEP 2: USER SUPPLIED TRAVEL PATH DISTANCE IN KM
    // =========================================================================
    if (currentState === 'AWAITING_SHIPPING_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid distance entry. Please input a positive numeric travel path amount in KM:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_whatsapp_state: 'AWAITING_SHIPPING_MODE',
                pending_whatsapp_payload: { ...pendingPayload, distance: numericDistance }
            })
            .eq('id', tokenRecord.id);

        const nativeShippingListPayload = {
            type: "list",
            header: { type: "text", text: "📦 SELECT FREIGHT MODE 📦" },
            body: { text: "Select a freight logistics transportation mode from the panel choice matrix below to complete auditing calculations:" },
            action: {
                // FIXED: Shortened action button label to 'Select Mode' (12 chars) to fall safely within Meta's strict 20-character maximum limit
                button: "Select Mode",
                sections: [
                    {
                        title: "CARRIER MODES",
                        rows: [
                            { id: "ship_mode_1", title: "Linehaul Truck", description: "Long-distance freight (Road Heavy)" },
                            { id: "ship_mode_2", title: "Urban Delivery Van", description: "Last-mile courier logistics (Road Light)" },
                            { id: "ship_mode_3", title: "Transnet Freight", description: "Rail distribution network system" },
                            { id: "ship_mode_4", title: "Deep Sea Cargo", description: "Containerized shipping routes (Ocean)" }
                        ]
                    }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeShippingListPayload);
        return true;
    }

    // =========================================================================
    // STEP 1: USER SUPPLIED CONSIGNMENT MASS WEIGHT IN TONNES
    // =========================================================================
    if (currentState === 'AWAITING_SHIPPING_WEIGHT') {
        const numericWeight = parseFloat(lowerMessage);
        if (isNaN(numericWeight) || numericWeight <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical cargo weight parameter amount:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_whatsapp_state: 'AWAITING_SHIPPING_DISTANCE',
                pending_whatsapp_payload: { cargo_weight: numericWeight }
            })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING DISPATCH DETAILS*\n\nPlease specify total cargo transport length:\n\n*DISTANCE (KM)*");
        return true;
    }

    return false;
}
