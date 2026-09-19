// src/app/api/v1/whatsapp/commandCalculations.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';
import { processConversationState } from './commandState';

/**
 * Core calculations controller with exhaustive diagnostic tracking logs.
 */
export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, incomingServerUrl }) {
    console.log(`\n================ 🧪 [CALCULATIONS GATE TRACE START] ================`);
    console.log(`📥 Raw Payload Inbound Token Value : "${lowerMessage}"`);
    console.log(`👤 Active User Target Profile Context: ID=${userProfile?.id} | Name="${userProfile?.first_name}"`);

    try {
        console.log(`📡 [Calculations Trace] Fetching freshest token record from DB table rows...`);
        const { data: latestTokenRow, error: syncError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('id', tokenRecord.id)
            .maybeSingle();

        if (syncError) {
            console.error(`🚨 [Calculations Trace DB Error] Token sync fault:`, syncError.message);
        }

        const activeTokenRecord = latestTokenRow || tokenRecord;
        console.log(`🔑 Active State Read From Database Token Row : "${activeTokenRecord?.current_whatsapp_state || 'null'}"`);

        console.log(`📡 [Calculations Trace] Pulling application config metadata and vehicle lists...`);
        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
        console.log(`📊 Total fully hydrated active vehicle array objects: ${activeVehicles.length}`);

        const mockTokenQuery = { data: activeTokenRecord };
        const mockProfRes = { data: userProfile };

        // 1. Hand over context directly to conversational state machine wizards
        console.log(`🔄 [Calculations Trace] Transferring control loop to processConversationState...`);
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

        console.log(`🎯 [Calculations Trace] processConversationState returned handled flag = ${stateHandled}`);
        if (stateHandled) {
            console.log(`🛑 [Calculations Trace INTERCEPTED] Sub-workflow handled the event. Ending thread calculation pass.`);
            console.log(`================ 🧪 [CALCULATIONS GATE TRACE END] ================\n`);
            return true;
        }

        const isInteractiveCallbackId = lowerMessage.startsWith('gas_type_') || lowerMessage.startsWith('gas_unit_');
        console.log(`🔍 [Calculations Trace] Evaluating macro keywords. lowerMessage starts with 'gas' = ${lowerMessage.startsWith('gas')} | isInteractiveCallbackId = ${isInteractiveCallbackId}`);

        // 2. Standalone fallback text-parsing commands (Macro triggers)
        if (lowerMessage.startsWith('vehicle')) {
            console.log(`🚚 [Calculations Trace] Intercepted as raw vehicle string macro command line...`);
            const pattern = /^vehicle\s+(\d+(?:\.\d+)?)\s*(km|miles)\s+([a-z0-9-]+)\$/i;
            const match = lowerMessage.match(pattern);
            if (!match) {
                console.warn(`⚠️ [Calculations Trace Format Fault] Direct vehicle string did not match structural regex.`);
                return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: vehicle [distance][unit] [vehicle_id]\nExample: vehicle 45km abc-123");
            }
            // ... computation sequence loop
        }

        if (lowerMessage.startsWith('gas') && !isInteractiveCallbackId) {
            console.log(`🔥 [Calculations Trace] Intercepted as raw gas stationary combustion macro text line...`);
            const pattern = /^gas\s+(\d+(?:\.\d+)?)\s*(natural_gas|lpg)\s+(m3|kwh|liter|kg)\$/i;
            const match = lowerMessage.match(pattern);
            if (!match) {
                console.warn(`⚠️ [Calculations Trace Format Fault] Direct gas string did not match structural regex.`);
                return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: gas [quantity] [type] [unit]\nExample: gas 120 natural_gas m3");
            }

            const [, quantity, gasType, gasUnit] = match;
            const form = { type: 'gas', quantity: quantity.toString(), gas_type: gasType.toUpperCase(), gas_unit: gasUnit.toLowerCase(), save_log: true };
            const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', form, activeTokenRecord?.api_token || '');
            const payload = formatEmissionPayload(calculatedKg);
            await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'gas', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
            return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${gasType.toUpperCase()}`, `${quantity} ${gasUnit.toUpperCase()}`, payload, usageCap, currentUsage));
        }

        console.log(`ℹ️ [Calculations Trace Fall-Through] Message did not satisfy standalone text macro logic rules.`);
        console.log(`================ 🧪 [CALCULATIONS GATE TRACE END] ================\n`);
        return false;

    } catch (criticalRuntimeError) {
        console.error(`\n🚨 [CRITICAL RUNTIME ERROR IN COMMAND CALCULATIONS LAYER]:`);
        console.error(`💥 Message Error Content: ${criticalRuntimeError.message}`);
        console.error(criticalRuntimeError.stack);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ System Fault: An internal processing error occurred (${criticalRuntimeError.message}). Resetting menu session.`);
        console.log(`================ 🧪 [CALCULATIONS GATE TRACE CRASH END] ================\n`);
        return false;
    }
}
