// src/app/api/v1/whatsapp/commandState.js

import { handleVehicleWorkflow } from './stateVehicle';
import { handleShippingWorkflow } from './stateShipping';
import { handleFlightWorkflow } from './stateFlight';
import { handleElectricityWorkflow } from './stateElectricity'; // Mounted Scope 2 sub-module
import { handleGasWorkflow } from './stateGas';                 // Mounted Scope 1 sub-module

export async function processConversationState({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes }) {
    const currentState = tokenRecord?.current_whatsapp_state || null;
    const pendingPayload = tokenRecord?.pending_whatsapp_payload || {};

    const sharedContext = { lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes, currentState, pendingPayload };

    // Evaluates dynamic multi-step step prompts sequentially across all trackers
    if (await handleVehicleWorkflow(sharedContext)) return true;
    if (await handleShippingWorkflow(sharedContext)) return true;
    if (await handleFlightWorkflow(sharedContext)) return true;
    if (await handleElectricityWorkflow(sharedContext)) return true;
    if (await handleGasWorkflow(sharedContext)) return true;

    return false;
}
