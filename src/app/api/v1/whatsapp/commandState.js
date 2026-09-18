// src/app/api/v1/whatsapp/commandState.js

import { sendMetaWhatsappMessage } from './metaClient';
import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute';
import { handleTaxWorkflow } from './stateTax';

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, incomingServerUrl }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload, incomingServerUrl };

    // =========================================================================
    // BRANCH A: ACTIVE PIPELINES LIFECYCLE MANAGEMENT GATES
    // =========================================================================
    if ((currentState === 'AWAITING_VEHICLE_DISTANCE' || currentState === 'AWAITING_VEHICLE_SELECTION') && await handleVehicleWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_SHIPPING_WEIGHT' || currentState === 'AWAITING_SHIPPING_DISTANCE' || currentState === 'AWAITING_SHIPPING_MODE') && await handleShippingWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_ROUTE_DISTANCE' || currentState === 'AWAITING_ROUTE_VEHICLE') && await handleRouteWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_FLIGHT_PASSENGERS' || currentState === 'AWAITING_FLIGHT_ORIGIN' || currentState === 'AWAITING_FLIGHT_DEST') && await handleFlightWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_POWER_KWH' || currentState === 'AWAITING_POWER_COUNTRY' || currentState === 'AWAITING_POWER_SOURCE') && await handleElectricityWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_GAS_QTY' || currentState === 'AWAITING_GAS_TYPE' || currentState === 'AWAITING_GAS_UNIT') && await handleGasWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_TAX_PERIOD' || currentState === 'AWAITING_TAX_REPORT_ACTION') && await handleTaxWorkflow(sharedContext)) return true;

    // =========================================================================
    // BRANCH B: INTERACTIVE SUB-MENU GATES (Advances states directly)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        // FIXED: Advance state tracking parameters and print the first step prompt directly from the gate interceptor
        if (lowerMessage === 'calc_opt_1' || lowerMessage === '1') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_VEHICLE_DISTANCE', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *VEHICLE AUDIT SETUP* \n\nPlease type the total trip travel path: \n\n*DISTANCE (KM)*");
            return true;
        }

        if (lowerMessage === 'calc_opt_2' || lowerMessage === '2') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_SHIPPING_WEIGHT', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING AUDIT SETUP* \n\nPlease specify total freight consignment mass weight:\n\n*WEIGHT (TONNES)*");
            return true;
        }

        if (lowerMessage === 'calc_opt_3' || lowerMessage === '3') {
            // Re-route dynamically straight down into the touch-list periods selection component module
            await handleTaxWorkflow({ ...sharedContext, lowerMessage: '3' });
            return true;
        }

        if (lowerMessage === 'calc_opt_4' || lowerMessage === '4') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_POWER_KWH', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
            return true;
        }

        if (lowerMessage === 'calc_opt_5' || lowerMessage === '5') {
            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_whatsapp_state: 'AWAITING_GAS_QTY', pending_whatsapp_payload: {} })
                .eq('id', tokenRecord.id);

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *GAS COMBUSTION SETUP* \n\nPlease enter the total fuel volume burned:\n\n*QUANTITY CAPACITY AMOUNT*");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
