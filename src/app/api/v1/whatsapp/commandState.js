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
    if (await handleVehicleWorkflow(sharedContext)) return true;
    if (await handleShippingWorkflow(sharedContext)) return true;
    if (await handleFlightWorkflow(sharedContext)) return true;
    if (await handleElectricityWorkflow(sharedContext)) return true;
    if (await handleGasWorkflow(sharedContext)) return true;

    // =========================================================================
    // FIXED: INTERCEPT CHOSEN OPTIONS WHILE INSIDE THE SUBMENU CHECKPOINT
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === '1') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_VEHICLE_DISTANCE' }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *VEHICLE AUDIT SETUP* \n\nPlease type the total trip travel path: \n\n*DISTANCE (KM)*");
            return true;
        }
        if (lowerMessage === '2') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_SHIPPING_WEIGHT' }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING AUDIT SETUP* \n\nPlease specify total freight consignment mass weight:\n\n*WEIGHT (TONNES)*");
            return true;
        }
        if (lowerMessage === '3') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_FLIGHT_PASSENGERS' }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT AUDIT SETUP* \n\nPlease type the total traveler volume tally count:\n\n*PASSENGERS COUNT*");
            return true;
        }
        if (lowerMessage === '4') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_POWER_KWH' }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
            return true;
        }
        if (lowerMessage === '5') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_GAS_QTY' }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *GAS COMBUSTION SETUP* \n\nPlease enter the total fuel volume burned:\n\n*QUANTITY CAPACITY AMOUNT*");
            return true;
        }

        // If an option other than 1-5 is sent, clear the sub-menu state and allow the flow to fall through back to the main menu
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
