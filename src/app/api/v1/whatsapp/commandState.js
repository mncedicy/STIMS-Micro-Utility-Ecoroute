// src/app/api/v1/whatsapp/commandState.js

import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    // FIXED: Added absolute 'await' keyword orchestrators to ensure asynchronous message buffers complete execution before the HTTP thread closes
    if (currentState?.startsWith('AWAITING_VEHICLE') && await handleVehicleWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_SHIPPING') && await handleShippingWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_FLIGHT') && await handleFlightWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_POWER') && await handleElectricityWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_GAS') && await handleGasWorkflow(sharedContext)) return true;

    // =========================================================================
    // INTERCEPT COMPONENT SELECTIONS INSIDE CALCULATOR SUBMENU PHASE
    // =========================================================================
    if (currentState === 'INSIDE_CALCULATOR_SUBMENU') {
        if (lowerMessage === '1') {
            // FIXED: Await the downstream child file worker execution blocks
            await handleVehicleWorkflow({ ...sharedContext, lowerMessage: '1' });
            return true;
        }
        if (lowerMessage === '2') {
            await handleShippingWorkflow({ ...sharedContext, lowerMessage: '2' });
            return true;
        }
        if (lowerMessage === '3') {
            const { handleFlightWorkflow } = await import('./stateFlight');
            await handleFlightWorkflow({ ...sharedContext, lowerMessage: '3' });
            return true;
        }
        if (lowerMessage === '4') {
            const { handleElectricityWorkflow } = await import('./stateElectricity');
            await handleElectricityWorkflow({ ...sharedContext, lowerMessage: '4' });
            return true;
        }
        if (lowerMessage === '5') {
            await handleGasWorkflow({ ...sharedContext, lowerMessage: '5' });
            return true;
        }

        // If an unmatched command comes in, clear the sub-menu checkpoint state flag
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
