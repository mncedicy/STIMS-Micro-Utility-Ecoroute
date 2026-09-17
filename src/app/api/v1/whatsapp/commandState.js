// src/app/api/v1/whatsapp/commandState.js

import { sendMetaWhatsappMessage } from './metaClient';
import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    // 1. Process active running multi-step wizard step lines if applicable
    if (currentState?.startsWith('AWAITING_VEHICLE') && await handleVehicleWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_SHIPPING') && await handleShippingWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_FLIGHT') && await handleFlightWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_POWER') && await handleElectricityWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_GAS') && await handleGasWorkflow(sharedContext)) return true;

    // =========================================================================
    // BRANCH B: SUB-MENU SELECTION GATES (Trigger ONLY if explicitly inside sub-menu context)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === '1') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_VEHICLE_DISTANCE', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *VEHICLE AUDIT SETUP* \n\nPlease type the total trip travel path: \n\n*DISTANCE (KM)*");
            return true;
        }

        if (lowerMessage === '2') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_SHIPPING_WEIGHT', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING AUDIT SETUP* \n\nPlease specify total freight consignment mass weight:\n\n*WEIGHT (TONNES)*");
            return true;
        }

        if (lowerMessage === '3') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_FLIGHT_PASSENGERS', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT AUDIT SETUP* \n\nPlease type the total traveler volume tally count:\n\n*PASSENGERS COUNT*");
            return true;
        }

        if (lowerMessage === '4') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_POWER_KWH', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
            return true;
        }

        if (lowerMessage === '5') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_GAS_QTY', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

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
