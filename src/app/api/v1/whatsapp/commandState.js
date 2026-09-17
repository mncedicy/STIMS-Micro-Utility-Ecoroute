// src/app/api/v1/whatsapp/commandState.js

import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute';
import { handleTaxWorkflow } from './stateTax';

/**
 * Master State Router: Isolates and directs conversational traffic based on the active state string token.
 * Forwards structural server URL context seamlessly to nested child handlers.
 */
export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, incomingServerUrl }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    // FIXED: Embedded incomingServerUrl directly within the shared contextual tracking envelope passed to children
    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload, incomingServerUrl };

    console.log(`📡 [State Engine Router] Evaluating isolated routing path for state: "${currentState}"`);

    // =========================================================================
    // BRANCH A: ISOLATED STATE MATCHING GATES (Prevents parameter condition leakage)
    // =========================================================================
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

    if (currentState === 'AWAITING_POWER_KWH' || currentState === 'AWAITING_POWER_COUNTRY' || currentState === 'AWAITING_POWER_SOURCE') {
        return await handleElectricityWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_GAS_QTY' || currentState === 'AWAITING_GAS_TYPE' || currentState === 'AWAITING_GAS_UNIT') {
        return await handleGasWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_TAX_PERIOD' || currentState === 'AWAITING_TAX_REPORT_ACTION') {
        // FIXED: Forwards execution flow down into the dynamic tax processor module with absolute server urls
        return await handleTaxWorkflow(sharedContext);
    }

    // =========================================================================
    // BRANCH B: INTERACTIVE SUB-MENU GATES (Only run if explicitly inside the container)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === '1') {
            await handleVehicleWorkflow({ ...sharedContext, lowerMessage: '1' });
            return true;
        }
        if (lowerMessage === '2') {
            await handleShippingWorkflow({ ...sharedContext, lowerMessage: '2' });
            return true;
        }
        if (lowerMessage === '3') {
            await handleFlightWorkflow({ ...sharedContext, lowerMessage: '3' });
            return true;
        }
        if (lowerMessage === '4') {
            await handleElectricityWorkflow({ ...sharedContext, lowerMessage: '4' });
            return true;
        }
        if (lowerMessage === '5') {
            await handleGasWorkflow({ ...sharedContext, lowerMessage: '5' });
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
