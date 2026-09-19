// src/app/api/v1/whatsapp/commandState.js

import { sendMetaWhatsappMessage } from './metaClient';
import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute';
import { handleTaxWorkflow } from './stateTax';

/**
 * Master State Router: Isolates and directs conversational traffic based on the active state string token.
 * Enforces absolute separation between phase steps to prevent cross-condition parameter leakages.
 */
export async function processConversationState(contextPayload) {
    const lowerMessage = String(contextPayload?.lowerMessage || '').trim().toLowerCase();
    const currentState = contextPayload?.tokenRecord?.current_whatsapp_state || null;

    const userProfile = contextPayload?.userProfile;
    const tokenRecord = contextPayload?.tokenRecord;
    const businessPhoneNumberId = contextPayload?.businessPhoneNumberId;
    const cleanPhoneNumber = contextPayload?.cleanPhoneNumber;
    const supabaseAdmin = contextPayload?.supabaseAdmin;
    const activeVehicles = contextPayload?.activeVehicles;
    const incomingServerUrl = contextPayload?.incomingServerUrl;

    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};
    const sharedContext = { ...contextPayload, currentState, pendingPayload };

    console.log(`📡 [State Engine Router Master Check] State: "${currentState}" | Input: "${lowerMessage}"`);

    // =========================================================================
    // FIXED: ROOT-LEVEL ABSOLUTE BYPASS INTERCEPT FOR STATELESS VEHICLE ASSETS
    // =========================================================================
    if (
        lowerMessage.startsWith('fleet_dash_id_') ||
        lowerMessage.startsWith('email-veh-') ||
        currentState === 'AWAITING_FLEET_DASHBOARD_SELECTION' ||
        currentState === 'AWAITING_FLEET_REPORT_EMAIL'
    ) {
        console.log(`🛡️ [CRITICAL INTERCEPT BYPASS] Captured fleet component key. Halting fall-through loops immediately.`);
        // Await the vehicle sub-module execution block completely before closing out the thread frame
        await handleVehicleWorkflow(sharedContext);
        return true; // FIXED: Root propagated exit code explicitly force-stops calculation macro parsers
    }

    // =========================================================================
    // BRANCH A: ABSOLUTE SEPARATED STATE MATCHING GATES
    // =========================================================================
    const isParameterizedGasButton = lowerMessage.startsWith('gas-type-') || lowerMessage.startsWith('gas-unit-');
    if (isParameterizedGasButton || ['gas-type-1', 'gas-type-2', 'gas-unit-1', 'gas-unit-2', 'gas-unit-3', 'gas-unit-4'].includes(lowerMessage)) {
        return await handleGasWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_VEHICLE_DISTANCE' || currentState === 'AWAITING_VEHICLE_SELECTION') {
        return await handleVehicleWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_SHIPPING_WEIGHT' || currentState === 'AWAITING_SHIPPING_DISTANCE' || currentState === 'AWAITING_SHIPPING_MODE') {
        return await handleShippingWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_ROUTE_DISTANCE' || currentState === 'AWAITING_ROUTE_VEHICLE') {
        return await handleRouteWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_FLIGHT_PASSENGERS' || currentState === 'AWAITING_FLIGHT_ORIGIN' || currentState === 'AWAITING_FLIGHT_DEST') {
        return await handleFlightWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_POWER_KWH' || currentState === 'AWAITING_POWER_SOURCE') {
        return await handleElectricityWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_GAS_QTY' || currentState === 'AWAITING_GAS_TYPE' || currentState === 'AWAITING_GAS_UNIT') {
        return await handleGasWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_TAX_PERIOD' || currentState === 'AWAITING_TAX_REPORT_ACTION') {
        return await handleTaxWorkflow(sharedContext);
    }

    // =========================================================================
    // BRANCH B: CALCULATOR SUB-MENU INTERCEPT GATES
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        const cleanChoice = String(lowerMessage || '').trim().toLowerCase();

        if (cleanChoice === 'calc_opt_1' || cleanChoice === '1') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_VEHICLE_DISTANCE', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *VEHICLE AUDIT SETUP* \n\nPlease type the total trip travel path: \n\n*DISTANCE (KM)*");
            return true;
        }
        if (cleanChoice === 'calc_opt_2' || cleanChoice === '2') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_SHIPPING_WEIGHT', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *SHIPPING AUDIT SETUP* \n\nPlease specify total freight consignment mass weight:\n\n*WEIGHT (TONNES)*");
            return true;
        }
        if (cleanChoice === 'calc_opt_3' || cleanChoice === '3') {
            await handleTaxWorkflow({ ...sharedContext, lowerMessage: 'launch_tax_period_menu', currentState: 'INSIDE_CALCULATOR_SUBMENU' });
            return true;
        }
        if (cleanChoice === 'calc_opt_4' || cleanChoice === '4') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_POWER_KWH', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *ELECTRICITY AUDIT SETUP* \n\nPlease input total energy utilization:\n\n*METRICS VOLUME (KWH)*");
            return true;
        }
        if (cleanChoice === 'calc_opt_5' || cleanChoice === '5') {
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_GAS_QTY', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *GAS COMBUSTION SETUP* \n\nPlease enter the total fuel volume burned:\n\n*QUANTITY CAPACITY AMOUNT*");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
