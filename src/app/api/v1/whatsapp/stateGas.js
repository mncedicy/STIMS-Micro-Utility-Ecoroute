// src/app/api/v1/whatsapp/stateGas.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

export async function handleGasWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState, pendingPayload }) {

    // FIXED: Grouped gas step transformations inside a distinct parent state verification loop
    if (currentState === 'AWAITING_GAS_UNIT') {
        const choice = lowerMessage.trim();
        const unitsMap = { "1": "m3", "2": "kwh", "3": "liter", "4": "kg" };
        const selectedUnit = unitsMap[choice];

        if (!selectedUnit) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Please reply with a number between 1 and 4 to choose a fuel volume measurement unit.");
            return true;
        }

        const finalQty = pendingPayload?.quantity;
        const finalType = pendingPayload?.gas_type;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing Scope 1 gas combustion carbon metrics...`);

        const form = { type: 'gas', quantity: finalQty.toString(), gas_type: finalType, gas_unit: selectedUnit, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'gas', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${finalType}`, `${finalQty} ${selectedUnit.toUpperCase()}`, payload, usageCap, currentUsage));
        return true;
    }

    if (currentState === 'AWAITING_GAS_TYPE') {
        const choice = lowerMessage.trim();
        if (choice !== '1' && choice !== '2') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Reply with *1* for Natural Gas or *2* for Liquefied Petroleum Gas (LPG):");
            return true;
        }

        const targetType = choice === '1' ? 'NATURAL_GAS' : 'LPG';

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_GAS_UNIT', pending_whatsapp_payload: { ...pendingPayload, gas_type: targetType } })
            .eq('id', tokenRecord.id);

        const unitPrompt =
            `🔥 *SELECT GAS QUANTITY MEASUREMENT UNIT* 🔥\n\n` +
            `Reply with a single list index option:\n\n` +
            `*1* — Cubic Metres (m3)\n` +
            `*2* — Kilowatt Hours (kWh)\n` +
            `*3* — Liquid Litres\n` +
            `*4* — Kilograms Weight (kg)`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, unitPrompt);
        return true;
    }

    if (currentState === 'AWAITING_GAS_QTY') {
        const numericQty = parseFloat(lowerMessage);
        if (isNaN(numericQty) || numericQty <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical combustion quantity amount:");
            return true;
        }

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_GAS_TYPE', pending_whatsapp_payload: { quantity: numericQty } })
            .eq('id', tokenRecord.id);

        const typePrompt =
            `🔥 *SELECT FUEL CLASSIFICATION TYPE* 🔥\n\n` +
            `Reply with an option index number:\n\n` +
            `*1* — Natural Gas (Stationary Mains)\n` +
            `*2* — LPG (Liquefied Petroleum Bottled Gas)`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, typePrompt);
        return true;
    }

    return false;
}
