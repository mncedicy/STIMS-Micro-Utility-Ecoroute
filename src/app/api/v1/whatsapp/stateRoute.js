// src/app/api/v1/whatsapp/stateRoute.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleRouteWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // STEP 3: USER SELECTED THE VEHICLE NUMBER INDEX
    if (currentState === 'AWAITING_ROUTE_VEHICLE') {
        const vehicleIndex = parseInt(lowerMessage, 10) - 1;
        const targetDistance = pendingPayload?.distance;

        if (isNaN(vehicleIndex) || vehicleIndex < 0 || vehicleIndex >= activeVehicles.length) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Invalid selection. Please reply with a number between 1 and ${activeVehicles.length} to map your route run.`);
            return true;
        }

        const selectedVehicle = activeVehicles[vehicleIndex];
        const vehicleId = selectedVehicle.id;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `🗺️ Computing terrain matrix optimizations and routing traces...`);

        // Runs identical backend vehicle calculations mapping for the terrain route track log
        const form = { type: 'vehicle', distance: targetDistance.toString(), unit: 'km', vehicle_id: vehicleId, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'vehicle', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Route Matrix Check: ${selectedVehicle.registration_number}`, `${targetDistance} KM Traced`, payload, usageCap, currentUsage));
        return true;
    }

    // STEP 2: USER INPUT THE TRIP PATH DISTANCE NUMBER
    if (currentState === 'AWAITING_ROUTE_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid path parameter. Please input a positive numeric trip distance in KM:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_ROUTE_VEHICLE', pending_whatsapp_payload: { distance: numericDistance } })
            .eq('id', tokenRecord.id);

        let prompt = `🗺️ *ROUTE CHECKER: SELECT VEHICLE ASSET* 🗺️\n\nChoose a linked profile by replying with its list item number:\n\n`;
        activeVehicles.forEach((veh, index) => {
            const reg = String(veh.registration_number || 'FLEET').toUpperCase();
            const make = String(veh.make || 'ASSET').toUpperCase();
            prompt += `*${index + 1}* — ${reg} [${make}]\n`;
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, prompt);
        return true;
    }

    return false;
}
