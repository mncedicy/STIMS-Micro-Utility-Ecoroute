// src/app/api/v1/whatsapp/commandState.js

import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute';

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    console.log(`📡 [State Engine Router] Evaluating isolated routing path for state: "${currentState}"`);

    // FIXED: Enforced explicit, absolute value matching gates to prevent conversational overlap leakage across trackers
    if (currentState === 'AWAITING_VEHICLE_DISTANCE' || currentState === 'AWAITING_VEHICLE_SELECTION') {
        return await handleVehicleWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_SHIPPING_WEIGHT' || currentState === 'AWAITING_SHIPPING_DISTANCE' || currentState === 'AWAITING_SHIPPING_MODE') {
        return await handleShippingWorkflow(sharedContext);
    }

    if (currentState === 'AWAITING_ROUTE_DISTANCE' || currentState === 'AWAITING_ROUTE_VEHICLE') {
        // FIXED: Explicitly passes the hydrated activeVehicles list downward without any object mutation variables overrides
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

    // =========================================================================
    // SUB-MENU GATES (Only run if explicitly inside the sub-menu container)
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

        // Clear sub-menu state if unmatched text parameters are received
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
