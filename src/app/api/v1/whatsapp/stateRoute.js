// src/app/api/v1/whatsapp/stateRoute.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleRouteWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    if (['menu', 'main menu', 'exit', 'cancel', 'stop'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    if (currentState === 'AWAITING_ROUTE_VEHICLE') {
        const choice = lowerMessage.trim();
        let selectedVehicle = null;

        if (choice.startsWith('veh_row_id_')) {
            const targetUuid = choice.replace('veh_row_id_', '');
            selectedVehicle = (activeVehicles || []).find(v => v.id === targetUuid);
        } else {
            const vehicleIndex = parseInt(choice, 10) - 1;
            if (!isNaN(vehicleIndex) && vehicleIndex >= 0 && vehicleIndex < (activeVehicles?.length || 0)) {
                selectedVehicle = activeVehicles[vehicleIndex];
            }
        }

        if (!selectedVehicle) {
            console.warn(`⚠️ [stateRoute Mismatch] Input value "${choice}" did not match any active vehicle UUID vectors.`);
            return true;
        }

        const targetDistance = pendingPayload?.distance;
        const vehicleId = selectedVehicle.id;

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `🗺️ Computing terrain matrix optimizations and routing traces...`);

        const form = { type: 'vehicle', distance: targetDistance.toString(), unit: 'km', vehicle_id: vehicleId, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'vehicle', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Route Matrix Check: ${selectedVehicle.registration_number}`, `${targetDistance} KM Traced`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_ROUTE_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid path parameter. Please input a positive numeric trip distance in KM:");
            return true;
        }

        let fleetAssetsList = activeVehicles || [];
        if (!fleetAssetsList || fleetAssetsList.length === 0) {
            const { data: dbRows } = await supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id);
            fleetAssetsList = (dbRows || []).filter(v => v.is_active !== false);
        }

        if (fleetAssetsList.length === 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "ℹ️ Aborted: No active vehicles linked to your EcoRoute profile.");
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_ROUTE_VEHICLE', pending_whatsapp_payload: { distance: numericDistance } }).eq('id', tokenRecord.id);

        const nativeFleetRows = fleetAssetsList.map((veh, index) => {
            return {
                id: `veh_row_id_${veh.id}`,
                title: `${index + 1} — ${String(veh.registration_number || 'FLEET').toUpperCase()}`.substring(0, 24),
                description: `${String(veh.make || 'ASSET').toUpperCase()} [${String(veh.model || 'NODE').toUpperCase()}]`.substring(0, 72)
            };
        });

        const nativeRouteListPayload = {
            type: "list",
            header: { type: "text", text: "🗺️ ROUTE CHECKER ASSET 🗺️" },
            body: { text: "Choose an active fleet profile asset from your registered dashboard list down below to complete routing analysis calculations:" },
            action: {
                button: "Select Asset Row",
                // FIXED: Shortened section title to 'AUTHORIZED FLEET' (16 chars) to satisfy Meta limits
                sections: [{ title: "AUTHORIZED FLEET", rows: nativeFleetRows }]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeRouteListPayload);
        return true;
    }

    return false;
}
