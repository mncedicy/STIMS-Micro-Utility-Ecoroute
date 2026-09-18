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
 * Enforces absolute separation between phase steps to prevent cross-condition parameters leakages.
 */
export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, incomingServerUrl }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload, incomingServerUrl };

    console.log(`📡 [State Engine Router] Evaluating isolated routing path for state: "${currentState}"`);

    // =========================================================================
    // BRANCH A: ABSOLUTE SEPARATED STATE MATCHING GATES (Prevents progression leakage)
    // =========================================================================

    // Explicit Isolation for Vehicle Audit Phases
    if (currentState === 'AWAITING_VEHICLE_DISTANCE') {
        return await handleVehicleWorkflow(sharedContext);
    }
    if (currentState === 'AWAITING_VEHICLE_SELECTION') {
        return await handleVehicleWorkflow(sharedContext);
    }

    // Explicit Isolation for Shipping Logistics Phases
    if (currentState === 'AWAITING_SHIPPING_WEIGHT') {
        return await handleShippingWorkflow(sharedContext);
    }
    if (currentState === 'AWAITING_SHIPPING_DISTANCE') {
        return await handleShippingWorkflow(sharedContext);
    }
    if (currentState === 'AWAITING_SHIPPING_MODE') {
        return await handleShippingWorkflow(sharedContext);
    }

    // Explicit Isolation for Route Checker Phases
    if (currentState === 'AWAITING_ROUTE_DISTANCE') {
        return await handleRouteWorkflow(sharedContext);
    }
    if (currentState === 'AWAITING_ROUTE_VEHICLE') {
        return await handleRouteWorkflow(sharedContext);
    }

    // Explicit Isolation for Aviation Flight Phases
    if (currentState === 'AWAITING_FLIGHT_PASSENGERS' || currentState === 'AWAITING_FLIGHT_ORIGIN' || currentState === 'AWAITING_FLIGHT_DEST') {
        return await handleFlightWorkflow(sharedContext);
    }

    // Explicit Isolation for Power Grid Utilities Phases
    if (currentState === 'AWAITING_POWER_KWH' || currentState === 'AWAITING_POWER_COUNTRY' || currentState === 'AWAITING_POWER_SOURCE') {
        return await handleElectricityWorkflow(sharedContext);
    }

    // Explicit Isolation for Gas Combustion Phases
    if (currentState === 'AWAITING_GAS_QTY' || currentState === 'AWAITING_GAS_TYPE' || currentState === 'AWAITING_GAS_UNIT') {
        return await handleGasWorkflow(sharedContext);
    }

    // Explicit Isolation for Statutory Tax Report Phases
    if (currentState === 'AWAITING_TAX_PERIOD' || currentState === 'AWAITING_TAX_REPORT_ACTION') {
        return await handleTaxWorkflow(sharedContext);
    }

    // =========================================================================
    // BRANCH B: INTERACTIVE SUB-MENU GATES (Triggers inside calculator sub-menu context)
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === 'calc_opt_1' || lowerMessage === '1') {
            await handleVehicleWorkflow({ ...sharedContext, lowerMessage: '1', currentState: 'LAUNCH_CALCULATOR_LIST_MENU' });
            return true;
        }
        if (lowerMessage === 'calc_opt_2' || lowerMessage === '2') {
            await handleShippingWorkflow({ ...sharedContext, lowerMessage: '2' });
            return true;
        }
        if (lowerMessage === 'calc_opt_3' || lowerMessage === '3') {
            await handleTaxWorkflow({ ...sharedContext, currentState: 'AWAITING_TAX_PERIOD' });
            return true;
        }
        if (lowerMessage === 'calc_opt_4' || lowerMessage === '4') {
            await handleElectricityWorkflow({ ...sharedContext, lowerMessage: '4' });
            return true;
        }
        if (lowerMessage === 'calc_opt_5' || lowerMessage === '5') {
            await handleGasWorkflow({ ...sharedContext, lowerMessage: '5' });
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
