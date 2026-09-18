// src/app/api/v1/whatsapp/commandCalculations.js

import { sendMetaWhatsappMessage } from './metaClient';
import { processConversationState } from './commandState';
import { executeDirectCalculations } from './directCalculations';

/**
 * Main coordinator gate for accounting workflows.
 * Fetches the freshest database row data before delegating to wizard workflows.
 */
export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, incomingServerUrl }) {
    console.log(`ℹ️ [Calculations Gate Entry] Processing message payload: "${lowerMessage}"`);

    try {
        // Fetch freshest token state directly from database to reflect interactive touches instantly
        const { data: freshTokenRecord } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('id', tokenRecord.id)
            .maybeSingle();

        const activeTokenRecord = freshTokenRecord || tokenRecord;

        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
        const mockTokenQuery = { data: activeTokenRecord };
        const mockProfRes = { data: userProfile };

        // 1. Evaluate conversation state machine transitions first
        const stateHandled = await processConversationState({
            lowerMessage,
            userProfile,
            tokenRecord: activeTokenRecord,
            currentUsage,
            usageCap,
            businessPhoneNumberId,
            cleanPhoneNumber,
            supabaseAdmin,
            appMetaRes,
            activeVehicles,
            mockTokenQuery,
            mockProfRes,
            incomingServerUrl
        });

        if (stateHandled) return true;

        // 2. Delegate straight macro text parsing command execution down to the isolated file channel
        return await executeDirectCalculations({
            lowerMessage,
            userProfile,
            tokenRecord: activeTokenRecord,
            currentUsage,
            usageCap,
            businessPhoneNumberId,
            cleanPhoneNumber,
            appMetaRes,
            mockTokenQuery,
            mockProfRes
        });

    } catch (criticalRuntimeError) {
        console.error(`🚨 [CRITICAL RUNTIME ERROR IN COMMAND CALCULATIONS]:`, criticalRuntimeError.message);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ System Fault: An internal processing error occurred (${criticalRuntimeError.message}). Resetting menu session.`);
        return false;
    }
}
