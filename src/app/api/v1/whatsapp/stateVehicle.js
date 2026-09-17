// src/app/api/v1/whatsapp/stateVehicle.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleVehicleWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {
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

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Processing calculator run for vehicle: ${selectedVehicle.registration_number || selectedVehicle.registration || 'FLEET'}...`);

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
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "ℹ️ Aborted: No active vehicles found on this profile profile. Link an asset row via your dashboard panel first.");
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

    return false;
}
