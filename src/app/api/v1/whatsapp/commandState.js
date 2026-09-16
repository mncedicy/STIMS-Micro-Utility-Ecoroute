// src/app/api/v1/whatsapp/commandState.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes };

    // =========================================================================
    // BRANCH A: ACTIVE MULTI-STEP WIZARD CHANNELS (Only trigger if state matches)
    // =========================================================================
    if (currentState === 'AWAITING_VEHICLE_SELECTION') {
        const vehicleIndex = parseInt(lowerMessage, 10) - 1;
        const targetDistance = pendingPayload?.distance;

        if (isNaN(vehicleIndex) || vehicleIndex < 0 || vehicleIndex >= activeVehicles.length) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Invalid selection. Please reply with a number between 1 and ${activeVehicles.length} to choose your vehicle.`);
            return true;
        }

        const selectedVehicle = activeVehicles[vehicleIndex];
        const vehicleId = selectedVehicle.id;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Processing calculator run for vehicle: ${selectedVehicle.registration_number || selectedVehicle.registration}...`);

        const form = { type: 'vehicle', distance: targetDistance.toString(), unit: 'km', vehicle_id: vehicleId, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'vehicle', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Vehicle: ${metadataLog?.vehicleProfile || selectedVehicle.registration}`, `${targetDistance} KM`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_VEHICLE_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical distance amount (e.g. 45).");
            return true;
        }

        if (activeVehicles.length === 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "ℹ️ Aborted: No active vehicles found. Link an asset row via your dashboard console first.");
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_VEHICLE_SELECTION', pending_whatsapp_payload: { distance: numericDistance } })
            .eq('id', tokenRecord.id);

        let prompt = `🚛 *SELECT VEHICLE ROW NUMBER* 🚛\n\nChoose an asset profile by replying with its number:\n\n`;
        activeVehicles.forEach((veh, index) => {
            const reg = (veh.registration_number || veh.registration || 'FLEET').toUpperCase();
            const make = (veh.make || 'ASSET').toUpperCase();
            prompt += `*${index + 1}* — ${reg} [${make}]\n`;
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, prompt);
        return true;
    }

    // =========================================================================
    // BRANCH B: SUB-MENU SELECTION GATES (Trigger ONLY if explicitly inside sub-menu context)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        // FIXED: Intercept input '1' through '5' cleanly inside the locked sub-menu state context gate parameters
        if (lowerMessage === '1') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_VEHICLE_DISTANCE', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *VEHICLE AUDIT SETUP* \n\nPlease type the total trip travel path: \n\n*DISTANCE (KM)*");
            return true;
        }

        if (lowerMessage === '2') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING AUDIT SETUP* \n\nPlease specify total freight consignment mass weight:\n\n*WEIGHT (TONNES)*");
            return true;
        }

        if (lowerMessage === '3') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT AUDIT SETUP* \n\nPlease type the total traveler volume tally count:\n\n*PASSENGERS COUNT*");
            return true;
        }

        if (lowerMessage === '4') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
            return true;
        }

        if (lowerMessage === '5') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *GAS COMBUSTION SETUP* \n\nPlease enter the total fuel volume burned:\n\n*QUANTITY CAPACITY AMOUNT*");
            return true;
        }

        // If any unmapped character is sent, clear the sub-menu checkpoint state flag
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null })
            .eq('id', tokenRecord.id);
    }

    return false;
}
