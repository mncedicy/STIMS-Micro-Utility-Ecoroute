// src/app/api/v1/whatsapp/stateFlight.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleFlightWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // Global escape hatches to main menu control panel layer
    if (['menu', 'main menu', 'exit', 'cancel'].includes(lowerMessage.trim().toLowerCase())) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 3: USER SUPPLIED DESTINATION AIRPORT TERMINAL STRING (IATA)
    // =========================================================================
    if (currentState === 'AWAITING_FLIGHT_DEST') {
        const destIata = lowerMessage.trim().toUpperCase();
        if (destIata.length !== 3) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid IATA code. Please input a 3-letter destination airport terminal token (e.g. CPT):");
            return true;
        }

        const finalPassengers = pendingPayload?.passengers;
        const finalOrigin = pendingPayload?.origin_iata;

        if (finalOrigin === destIata) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Validation Error: Flight origin and destination terminals cannot match. Process aborted.");
            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing telescopic aviation emissions metrics...`);

        const form = { type: 'flight', passengers: finalPassengers.toString(), origin_iata: finalOrigin, dest_iata: destIata, flight_class: 'economy', save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('flight', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'flight', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Flight: ${finalOrigin} ➔ ${destIata}`, `${finalPassengers} Pax (Economy)`, payload, usageCap, currentUsage));
        return true;
    }

    // =========================================================================
    // STEP 2: USER SUPPLIED DEPARTURE AIRPORT TERMINAL STRING (IATA)
    // =========================================================================
    if (currentState === 'AWAITING_FLIGHT_ORIGIN') {
        const originIata = lowerMessage.trim().toUpperCase();
        if (originIata.length !== 3) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid IATA code. Please input a 3-letter origin airport terminal token (e.g. JNB):");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_FLIGHT_DEST', pending_whatsapp_payload: { ...pendingPayload, origin_iata: originIata } })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT ROUTING DETAILS*\n\nPlease specify destination airport terminal string:\n\n*DESTINATION IATA CODE (e.g. CPT)*");
        return true;
    }

    // =========================================================================
    // STEP 1: USER SUPPLIED PASSENGER TALLY COUNT VALUE
    // =========================================================================
    if (currentState === 'AWAITING_FLIGHT_PASSENGERS') {
        const numericPax = parseInt(lowerMessage, 10);
        if (isNaN(numericPax) || numericPax <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive integer passenger count tally number:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_FLIGHT_ORIGIN', pending_whatsapp_payload: { passengers: numericPax } })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT ROUTING DETAILS*\n\nPlease specify departure airport terminal string:\n\n*ORIGIN IATA CODE (e.g. JNB)*");
        return true;
    }

    // =========================================================================
    // FIXED: INTERCEPT BOTH INTERACTIVE SELECTION BUTTONS AND MANUAL MACRO CHECKS
    // =========================================================================
    if (lowerMessage === 'calc_opt_3' || lowerMessage === '3' || currentState === 'LAUNCH_FLIGHT_WIZARD_PROMPT') {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_FLIGHT_PASSENGERS', pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *FLIGHT AUDIT SETUP* \n\nPlease type the total traveler volume tally count:\n\n*PASSENGERS COUNT*");
        return true;
    }

    return false;
}
