// src/app/api/v1/whatsapp/commandCalculations.js

import { sendMetaWhatsappMessage } from './metaClient';
import { processConversationState } from './commandState';
import { executeDirectCalculations } from './directCalculations';

export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin }) {
    console.log(`ℹ️ [Calculations Gate Entry] Processing message: "${lowerMessage}"`);

    try {
        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
        const mockTokenQuery = { data: tokenRecord };
        const mockProfRes = { data: userProfile };

        // 1. Evaluate conversation state transformations first
        const stateHandled = await processConversationState({
            lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes
        });

        if (stateHandled) return true;

        // 2. Delegate straight fallback standalone text parsing string commands
        return await executeDirectCalculations({
            lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes
        });

    } catch (criticalRuntimeError) {
        console.error(`🚨 [CRITICAL RUNTIME ERROR IN COMMAND CALCULATIONS]:`, criticalRuntimeError.message);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ System Fault: An internal processing error occurred (${criticalRuntimeError.message}). Resetting menu session.`);
        return false;
    }
}
