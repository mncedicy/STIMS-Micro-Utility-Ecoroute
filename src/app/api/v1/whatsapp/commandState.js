// src/app/api/v1/whatsapp/commandState.js

import { sendMetaWhatsappMessage } from './metaClient';
import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity';
import { handleGasWorkflow } from './stateGas';
import { handleRouteWorkflow } from './stateRoute'; // Mounted newly isolated route module

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    // Evaluates multi-step input prompt checks across active pipelines
    if (currentState?.startsWith('AWAITING_VEHICLE') && await handleVehicleWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_SHIPPING') && await handleShippingWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_FLIGHT') && await handleFlightWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_POWER') && await handleElectricityWorkflow(sharedContext)) return true;
    if (currentState?.startsWith('AWAITING_GAS') && await handleGasWorkflow(sharedContext)) return true;

    // FIXED: Evaluate state lifecycle matching targets for active route checker queries
    if (currentState?.startsWith('AWAITING_ROUTE') && await handleRouteWorkflow(sharedContext)) return true;

    // =========================================================================
    // SUB-MENU SELECTION SECTOR GATES (Triggers inside calculator sub-menu context)
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

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null }).eq('id', tokenRecord.id);
    }

    return false;
}
