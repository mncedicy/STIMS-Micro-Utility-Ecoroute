// src/app/api/v1/whatsapp/commandState.js

import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute';
import { handleTaxWorkflow } from './stateTax'; // Mounted the newly generated statutory tax report sub-module

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    // Direct isolated routing state check validations loop paths
    if ((currentState === 'AWAITING_VEHICLE_DISTANCE' || currentState === 'AWAITING_VEHICLE_SELECTION') && await handleVehicleWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_SHIPPING_WEIGHT' || currentState === 'AWAITING_SHIPPING_DISTANCE' || currentState === 'AWAITING_SHIPPING_MODE') && await handleShippingWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_ROUTE_DISTANCE' || currentState === 'AWAITING_ROUTE_VEHICLE') && await handleRouteWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_FLIGHT_PASSENGERS' || currentState === 'AWAITING_FLIGHT_ORIGIN' || currentState === 'AWAITING_FLIGHT_DEST') && await handleFlightWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_POWER_KWH' || currentState === 'AWAITING_POWER_COUNTRY' || currentState === 'AWAITING_POWER_SOURCE') && await handleElectricityWorkflow(sharedContext)) return true;
    if ((currentState === 'AWAITING_GAS_QTY' || currentState === 'AWAITING_GAS_TYPE' || currentState === 'AWAITING_GAS_UNIT') && await handleGasWorkflow(sharedContext)) return true;

    // FIXED: Evaluate intercept matching conditions for running statutory tax reports configurations
    if (currentState === 'AWAITING_TAX_PERIOD' && await handleTaxWorkflow(sharedContext)) return true;

    // =========================================================================
    // SUB-MENU GATES (Only run if explicitly inside the sub-menu container)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === '1') { await handleVehicleWorkflow({ ...sharedContext, lowerMessage: '1' }); return true; }
        if (lowerMessage === '2') { await handleShippingWorkflow({ ...sharedContext, lowerMessage: '2' }); return true; }
        if (lowerMessage === '3') { await handleFlightWorkflow({ ...sharedContext, lowerMessage: '3' }); return true; }
        if (lowerMessage === '4') { await handleElectricityWorkflow({ ...sharedContext, lowerMessage: '4' }); return true; }
        if (lowerMessage === '5') { await handleGasWorkflow({ ...sharedContext, lowerMessage: '5' }); return true; }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
