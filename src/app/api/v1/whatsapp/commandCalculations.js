// src/app/api/v1/whatsapp/commandCalculations.js

import { sendMetaWhatsappMessage } from './metaClient';
import { processConversationState } from './commandState';
import { executeDirectCalculations } from './directCalculations';

export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, incomingServerUrl }) {
    console.log(`ℹ️ [Calculations Gate Entry] Processing message: "${lowerMessage}"`);

    try {
        // FIXED: Pull the fresh token row state directly from the database to reflect interactive clicks instantly
        const { data: freshTokenRecord, error: tokenError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('id', tokenRecord.id)
            .maybeSingle();

        if (tokenError) console.error(`🚨 [Token Fetch Failure]:`, tokenError.message);

        const activeTokenRecord = freshTokenRecord || tokenRecord;

        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
        const mockTokenQuery = { data: activeTokenRecord };
        const mockProfRes = { data: userProfile };

        // FIXED: Forwarding the absolute latest database token state values down into your wizard engines
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

        return await executeDirectCalculations({
            lowerMessage, userProfile, tokenRecord: activeTokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, appMetaRes, activeVehicles, mockTokenQuery, mockProfRes
        });

    } catch (criticalRuntimeError) {
        console.error(`🚨 [CRITICAL RUNTIME ERROR IN COMMAND CALCULATIONS]:`, criticalRuntimeError.message);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ System Fault: An internal processing error occurred (${criticalRuntimeError.message}). Resetting menu session.`);
        return false;
    }
}
