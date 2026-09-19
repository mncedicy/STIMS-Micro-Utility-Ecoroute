// src/app/api/v1/whatsapp/stateVehicle.js

import { sendMetaWhatsappMessage } from './metaClient';
import { executeVehicleCalculationStep } from './vehicleCalculator';
import { executeVehicleDashboardStep } from './vehicleDashboard';

/**
 * Handles conversational routing steps for the Vehicle Calculator and Fleet Asset options.
 */
export async function handleVehicleWorkflow(contextPayload) {
    const { lowerMessage, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin } = contextPayload;
    const choice = String(lowerMessage || '').trim();
    const normalizedInputToken = choice.toLowerCase();
    const currentState = tokenRecord?.current_whatsapp_state || null;

    // Global Menu escape hatches
    if (['menu', 'main menu', 'exit', 'cancel'].includes(normalizedInputToken)) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // ROUTE OPTION A: FLEET MANAGEMENT WORKFLOW VIEWS (Option 5 Lifecycle)
    // =========================================================================
    if (
        currentState === 'AWAITING_FLEET_DASHBOARD_SELECTION' ||
        currentState === 'AWAITING_FLEET_REPORT_EMAIL' ||
        normalizedInputToken.startsWith('fleet_dash_id_') ||
        normalizedInputToken.startsWith('email-veh-')
    ) {
        return await executeVehicleDashboardStep(contextPayload);
    }

    // =========================================================================
    // ROUTE OPTION B: EMISSIONS CALCULATOR WORKFLOW VIEWS (Option 1 Lifecycle)
    // =========================================================================
    if (
        currentState === 'AWAITING_VEHICLE_DISTANCE' ||
        currentState === 'AWAITING_VEHICLE_SELECTION' ||
        normalizedInputToken === 'launch_calculator_list_menu'
    ) {
        return await executeVehicleCalculationStep(contextPayload);
    }

    return false;
}
