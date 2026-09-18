// src/app/api/v1/whatsapp/stateVehicle.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
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

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Processing calculator run for vehicle: ${selectedVehicle.registration_number || 'FLEET'}...`);

        const form = { type: 'vehicle', distance: targetDistance.toString(), unit: 'km', vehicle_id: vehicleId, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'vehicle', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Vehicle: ${metadataLog?.vehicleProfile || selectedVehicle.registration_number}`, `${targetDistance} KM`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_VEHICLE_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical distance amount (e.g. 45).");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_VEHICLE_SELECTION', pending_whatsapp_payload: { distance: numericDistance } }).eq('id', tokenRecord.id);

        let prompt = `🚛 *SELECT VEHICLE ROW NUMBER* 🚛\n\nChoose an asset profile by replying with its number:\n\n`;
        activeVehicles.forEach((veh, index) => {
            prompt += `*${index + 1}* — ${String(veh.registration_number || 'FLEET').toUpperCase()} [${String(veh.make || 'ASSET').toUpperCase()}]\n`;
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, prompt);
        return true;
    }

    // =========================================================================
    // FIXED: DISPATCH NATIVE INTERACTIVE LIST COMPONENT FOR CALCULATOR OPTIONS
    // =========================================================================
    if (lowerMessage === '1') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'INSIDE_CALCULATOR_SUBMENU', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

        const nativeCalcList = {
            type: "list",
            header: { type: "text", text: "Emissions Carbon Trackers" },
            body: { text: "Select an active emissions category parameter grid row from the selector panel below to start your step-by-step calculator audit run:" },
            action: {
                button: "Select Category",
                sections: [
                    {
                        title: "AVAILABLE TRACKER FIELDS",
                        rows: [
                            { id: "calc_opt_1", title: "🚛 1. Vehicle Audit", description: "Terrestrial fleet transit and fuel burn logs" },
                            { id: "calc_opt_2", title: "📦 2. Cargo Shipping", description: "Freight consignment log weight and lengths" },
                            { id: "calc_opt_3", title: "✈️ 3. Flight Aviation", description: "Passenger volume airport terminal codes" },
                            { id: "calc_opt_4", title: "⚡ 4. Electricity Utility", description: "Scope 2 grid region consumption tallies" },
                            { id: "calc_opt_5", title: "🔥 5. Gas Stationary", description: "Scope 1 stationary fuel burner elements" }
                        ]
                    }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeCalcList);
        return true;
    }

    return false;
}
