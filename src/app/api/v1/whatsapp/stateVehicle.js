// src/app/api/v1/whatsapp/stateVehicle.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleVehicleWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // STEP 3: USER TAP-SELECTED A SPECIFIC NATIVE VEHICLE ASSET ROW ITEM
    if (currentState === 'AWAITING_VEHICLE_SELECTION') {
        const choice = lowerMessage.trim();
        let selectedVehicle = null;

        // FIXED: Dynamically resolve vehicle record target via unique interactive element payload ID token arrays
        if (choice.startsWith('veh_row_id_')) {
            const targetUuid = choice.replace('veh_row_id_', '');
            selectedVehicle = activeVehicles.find(v => v.id === targetUuid);
        } else {
            // Fallback backward compatibility logic support for legacy sequential numeric text entries
            const vehicleIndex = parseInt(choice, 10) - 1;
            if (!isNaN(vehicleIndex) && vehicleIndex >= 0 && vehicleIndex < activeVehicles.length) {
                selectedVehicle = activeVehicles[vehicleIndex];
            }
        }

        if (!selectedVehicle) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Invalid asset selection. Please use the menu picker panel to select a vehicle.`);
            return true;
        }

        const targetDistance = pendingPayload?.distance;
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

    // STEP 2: USER SUPPLIED TRIP MOVEMENT DISTANCE PATH NUMBER
    if (currentState === 'AWAITING_VEHICLE_DISTANCE') {
        const numericDistance = parseFloat(lowerMessage);
        if (isNaN(numericDistance) || numericDistance <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical distance amount (e.g. 45).");
            return true;
        }

        if (!activeVehicles || activeVehicles.length === 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "ℹ️ Aborted: No active vehicles found on this profile. Link an asset row via your dashboard panel first.");
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
            return true;
        }

        // Commit transaction fields state ahead of network prompt dispatch window
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_VEHICLE_SELECTION', pending_whatsapp_payload: { distance: numericDistance } }).eq('id', tokenRecord.id);

        // FIXED: Programmatically map array items directly into structured Meta row component parameters 
        const nativeFleetRows = activeVehicles.map((veh, index) => {
            const regNum = String(veh.registration_number || 'FLEET').toUpperCase();
            const makeLabel = String(veh.make || 'ASSET').toUpperCase();
            const modelLabel = String(veh.model || 'NODE').toUpperCase();

            return {
                id: `veh_row_id_${veh.id}`,
                title: `${index + 1} — ${regNum}`,
                description: `${makeLabel} [${modelLabel}]`
            };
        });

        // FIXED: Render high-fidelity native interactive selector layout frame panel over the wire
        const nativeFleetListPayload = {
            type: "list",
            header: { type: "text", text: "🚛 SELECT VEHICLE REGISTRY 🚛" },
            body: { text: "Choose an active fleet profile asset from your registered dashboard list down below to calculate emissions parameters:" },
            action: {
                button: "Select Asset Row",
                sections: [
                    {
                        title: "AUTHORIZED CORPORATE FLEET",
                        rows: nativeFleetRows
                    }
                ]
            }
        };

        console.log(`📡 Dispatching native vehicle asset selection interactive popup selector card.`);
        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeFleetListPayload);
        return true;
    }

    // STEP 1: INITIAL RE-ENTRY SWITCH (LAUNCH CARD OVERVIEW SELECTION GRID)
    if (lowerMessage === 'LAUNCH_CALCULATOR_LIST_MENU') {
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
                            { id: "calc_opt_1", title: "🚛 Vehicle Audit", description: "Terrestrial fleet transit and fuel burn logs" },
                            { id: "calc_opt_2", title: "📦 Cargo Shipping", description: "Freight consignment log weight and lengths" },
                            { id: "calc_opt_3", title: "✈️ Flight Aviation", description: "Passenger volume airport terminal codes" },
                            { id: "calc_opt_4", title: "⚡ Electricity Utility", description: "Scope 2 grid region consumption tallies" },
                            { id: "calc_opt_5", title: "🔥 Gas Stationary", description: "Scope 1 stationary fuel burner elements" }
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
