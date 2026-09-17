// src/app/api/v1/whatsapp/commandCalculations.js

import { sendMetaWhatsappMessage } from './metaClient';
import { processConversationState } from './commandState';
import { executeDirectCalculations } from './directCalculations';

/**
 * Orchestrates emissions parsing and checks conversational lifecycle gates.
 * Injected with strict trace logs to catch pipeline failures before network closures.
 */
export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin }) {
    console.log(`\n============== 🧪 [WHATSAPP DIAGNOSTIC TRACE START] ==============`);
    console.log(`📱 Inbound Input Token: "${lowerMessage}"`);
    console.log(`👤 Profile Identity Ref: ID=${userProfile?.id} | Name="${userProfile?.first_name}" | Company="${userProfile?.company}"`);
    console.log(`🔑 Token State Cache: activeState="${tokenRecord?.current_whatsapp_state || 'NONE'}" | rowId=${tokenRecord?.id}`);

    try {
        console.log(`📡 [Step 1/3] Concurrently pulling applications configuration meta and fleet vehicles list from Supabase...`);
        const [appMetaRes, vehiclesResult] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id)
        ]);

        if (vehiclesResult.error) {
            console.error(`🚨 [Database Error] ecoroute_vehicles query exception:`, vehiclesResult.error.message);
        }
        if (appMetaRes.error) {
            console.error(`🚨 [Database Error] applications query exception:`, appMetaRes.error.message);
        }

        const rawVehicles = vehiclesResult.data || [];
        console.log(`📊 [Database Raw Metrics] Total unfiltered records returned from public.ecoroute_vehicles: ${rawVehicles.length}`);

        const activeVehicles = rawVehicles.filter(veh => veh.is_active !== false);
        console.log(`✅ [Database Filter Metrics] Total validated active vehicles (where is_active !== false): ${activeVehicles.length}`);
        if (activeVehicles.length > 0) {
            activeVehicles.forEach((v, i) => console.log(`   👉 Vehicle [${i + 1}]: ID=${v.id} | Reg=${v.registration_number} | Make=${v.make}`));
        }

        const mockTokenQuery = { data: tokenRecord };
        const mockProfRes = { data: userProfile };

        // 1. Evaluate conversation state transformations first
        console.log(`🔄 [Step 2/3] Handing routing execution context directly to processConversationState...`);
        const stateHandled = await processConversationState({
            lowerMessage,
            userProfile,
            tokenRecord,
            currentUsage,
            usageCap,
            businessPhoneNumberId,
            cleanPhoneNumber,
            supabaseAdmin,
            appMetaRes,
            activeVehicles,
            mockTokenQuery,
            mockProfRes
        });

        console.log(`🎯 [Step 2/3 Outcome] processConversationState evaluated outcome flag to: ${stateHandled}`);
        if (stateHandled) {
            console.log(`🛑 [Intercepted] Multi-step conversation step handled. Stopping fall-through execution loop cleanly.`);
            console.log(`============== 🧪 [WHATSAPP DIAGNOSTIC TRACE END] ==============\n`);
            return true;
        }

        // 2. Delegate straight fallback standalone text parsing string commands
        console.log(`📡 [Step 3/3] Falling through to standalone regex parser (executeDirectCalculations)...`);
        const directHandled = await executeDirectCalculations({
            lowerMessage,
            userProfile,
            tokenRecord,
            currentUsage,
            usageCap,
            businessPhoneNumberId,
            cleanPhoneNumber,
            appMetaRes,
            activeVehicles,
            mockTokenQuery,
            mockProfRes
        });

        console.log(`🏁 [Final Outcome] executeDirectCalculations returned handled flag = ${directHandled}`);
        console.log(`============== 🧪 [WHATSAPP DIAGNOSTIC TRACE END] ==============\n`);
        return directHandled;

    } catch (criticalRuntimeError) {
        console.error(`\n🚨 [CRITICAL RUNTIME EXCEPTION CAUGHT IN EMISSIONS CALCULATIONS LAYER]:`);
        console.error(`💥 Error Stack Message: ${criticalRuntimeError.message}`);
        console.error(criticalRuntimeError.stack);

        console.log(`📡 [Emergency Rescue] Sending emergency fallback text string parameter to user tray channel...`);
        await sendMetaWhatsappMessage(
            businessPhoneNumberId,
            cleanPhoneNumber,
            `⚠️ Mobile Sync Exception: An internal structural processing fault occurred (${criticalRuntimeError.message}). Your session has been safely reset to the main system controls menu.`
        );

        console.log(`============== 🧪 [WHATSAPP DIAGNOSTIC TRACE CRASH END] ==============\n`);
        return false;
    }
}
