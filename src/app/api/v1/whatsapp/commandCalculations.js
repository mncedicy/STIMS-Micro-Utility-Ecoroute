// src/app/api/v1/whatsapp/commandCalculations.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';
import { processConversationState } from './commandState';

/**
 * Core calculations controller with synchronized real-time state lookups.
 * Guarantees data hydration occurs AFTER state mutations clear.
 */
export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, incomingServerUrl }) {
    console.log(`ℹ️ [Calculations Gate Entry] Real-time state check for input: "${lowerMessage}"`);

    try {
        const { data: latestTokenRow, error: syncError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('id', tokenRecord.id)
            .maybeSingle();

        if (syncError) console.error(`🚨 [State Sync Error]:`, syncError.message);
        const activeTokenRecord = latestTokenRow || tokenRecord;

        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
        const mockTokenQuery = { data: activeTokenRecord };
        const mockProfRes = { data: userProfile };

        // 1. Process active conversational multi-step wizard stages first with fresh data
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

        // FIXED: Do not intercept interactive button callback IDs as legacy standalone plain-text macro commands
        const isInteractiveCallbackId = lowerMessage.startsWith('gas_type_') || lowerMessage.startsWith('gas_unit_');

        // 2. Standalone fallback text-parsing commands (Macro triggers)
        if (lowerMessage.startsWith('vehicle')) {
            const pattern = /^vehicle\s+(\d+(?:\.\d+)?)\s*(km|miles)\s+([a-z0-9-]+)\$/i;
            const match = lowerMessage.match(pattern);
            if (!match) return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: vehicle [distance][unit] [vehicle_id]\nExample: vehicle 45km abc-123");

            const [, distance, unit, vehicleId] = match;
            const form = { type: 'vehicle', distance: distance.toString(), unit: unit.toLowerCase(), vehicle_id: vehicleId.trim(), save_log: true };
            const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', form, activeTokenRecord?.api_token || '');
            const payload = formatEmissionPayload(calculatedKg);
            await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'vehicle', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
            return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Vehicle: ${metadataLog?.vehicleProfile || vehicleId.toUpperCase()}`, `${distance} ${unit.toUpperCase()}`, payload, usageCap, currentUsage));
        }

        if (lowerMessage.startsWith('gas') && !isInteractiveCallbackId) {
            const pattern = /^gas\s+(\d+(?:\.\d+)?)\s*(natural_gas|lpg)\s+(m3|kwh|liter|kg)\$/i;
            const match = lowerMessage.match(pattern);
            if (!match) return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: gas [quantity] [type] [unit]\nExample: gas 120 natural_gas m3");

            const [, quantity, gasType, gasUnit] = match;
            const form = { type: 'gas', quantity: quantity.toString(), gas_type: gasType.toUpperCase(), gas_unit: gasUnit.toLowerCase(), save_log: true };
            const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', form, activeTokenRecord?.api_token || '');
            const payload = formatEmissionPayload(calculatedKg);
            await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'gas', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
            return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${gasType.toUpperCase()}`, `${quantity} ${gasUnit.toUpperCase()}`, payload, usageCap, currentUsage));
        }

        return false;
    } catch (criticalRuntimeError) {
        console.error(`🚨 [CRITICAL RUNTIME ERROR IN COMMAND CALCULATIONS]:`, criticalRuntimeError.message);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ System Fault: An internal processing error occurred (${criticalRuntimeError.message}). Resetting menu session.`);
        return false;
    }
}
