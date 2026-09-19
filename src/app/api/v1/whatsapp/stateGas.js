// src/app/api/v1/whatsapp/stateGas.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

/**
 * Handles the Gas Combustion workflow using stateless parameterized action strings
 * to guarantee resilience against asynchronous database table state leaks.
 */
export async function handleGasWorkflow({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, appMetaRes, mockTokenQuery, mockProfRes, currentState }) {

    const choice = String(lowerMessage || '').trim().toLowerCase();

    // Check escape hatches to main menu control panel layer
    if (['menu', 'main menu', 'exit', 'cancel'].includes(choice)) {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        return false;
    }

    // =========================================================================
    // STEP 3: USER SELECTED THE MEASUREMENT UNIT (Stateless Parameter Unpacking)
    // =========================================================================
    if (currentState === 'AWAITING_GAS_UNIT' || choice.startsWith('gas_unit_')) {
        // Expected format structure: gas_unit_[index]_[type]_[qty] (e.g., gas_unit_2_natural_gas_45)
        const tokenParts = choice.split('_');

        const unitsMap = { "1": "m3", "2": "kwh", "3": "liter", "4": "kg" };
        const selectedUnit = unitsMap[tokenParts[2]] || tokenRecord?.pending_whatsapp_payload?.gas_unit;

        if (!selectedUnit) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Please use the menu panel below to select a valid unit.");
            return true;
        }

        // Unpack parameters natively from the token string split matrix
        const finalType = String(tokenParts[3] || tokenRecord?.pending_whatsapp_payload?.gas_type || 'NATURAL_GAS').toUpperCase();
        const finalQty = parseFloat(tokenParts[4] || tokenRecord?.pending_whatsapp_payload?.quantity || 1);

        console.log(`🏁 [stateGas Final Step] Stateless Computation: Qty=${finalQty} | Type=${finalType} | Unit=${selectedUnit}`);

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Computing Scope 1 gas combustion carbon metrics...`);

        const form = { type: 'gas', quantity: finalQty.toString(), gas_type: finalType, gas_unit: selectedUnit, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', form, tokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'gas', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${finalType}`, `${finalQty} ${selectedUnit.toUpperCase()}`, payload, usageCap, currentUsage));
        return true;
    }

    // =========================================================================
    // STEP 2: USER SELECTED THE FUEL TYPE (Stateless Parameter Unpacking)
    // =========================================================================
    if (currentState === 'AWAITING_GAS_TYPE' || choice.startsWith('gas_type_')) {
        // Expected format structure: gas_type_[index]_[qty] (e.g., gas_type_1_45)
        const tokenParts = choice.split('_');
        const activeIndex = tokenParts[2]; // "1" or "2"
        const activeQty = parseFloat(tokenParts[3] || tokenRecord?.pending_whatsapp_payload?.quantity || 1);

        if (activeIndex !== '1' && activeIndex !== '2') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid selection. Please use the option buttons below to select the fuel type:");
            return true;
        }

        const targetType = activeIndex === '1' ? 'NATURAL_GAS' : 'LPG';

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_GAS_UNIT',
            pending_whatsapp_payload: { quantity: activeQty, gas_type: targetType }
        }).eq('id', tokenRecord.id);

        // FIXED: Embedded parameters inside the row IDs to pass context to Step 3 statelessly
        const nativeUnitListPayload = {
            type: "list",
            header: { type: "text", text: "🔥 SELECT GAS UNIT 🔥" },
            body: { text: `Processing ${activeQty} units run for fuel type: ${targetType}.\n\nSelect a measurement unit from the choices below:` },
            action: {
                button: "Select Unit",
                sections: [
                    {
                        title: "MEASUREMENT UNITS",
                        rows: [
                            { id: `gas_unit_1_${targetType.toLowerCase()}_${activeQty}`, title: "Cubic Metres (m3)", description: "Volumetric measurement parameter" },
                            { id: `gas_unit_2_${targetType.toLowerCase()}_${activeQty}`, title: "Kilowatt Hours (kWh)", description: "Energy capacity consumption metric" },
                            { id: `gas_unit_3_${targetType.toLowerCase()}_${activeQty}`, title: "Liquid Litres", description: "Volumetric fluid capacity measure" },
                            { id: `gas_unit_4_${targetType.toLowerCase()}_${activeQty}`, title: "Kilograms Weight (kg)", description: "Mass unit weight capacity parameter" }
                        ]
                    }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeUnitListPayload);
        return true;
    }

    // =========================================================================
    // STEP 1: USER SUPPLIED FUEL COMBUSTION QUANTITY
    // =========================================================================
    if (currentState === 'AWAITING_GAS_QTY') {
        const numericQty = parseFloat(lowerMessage);
        if (isNaN(numericQty) || numericQty <= 0) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Invalid value. Please type a positive numerical combustion quantity amount:");
            return true;
        }

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_GAS_TYPE',
            pending_whatsapp_payload: { quantity: numericQty }
        }).eq('id', tokenRecord.id);

        // FIXED: Embedded the quantity parameter value directly inside the button IDs
        const nativeTypeButtonsPayload = {
            type: "button",
            body: { text: `🔥 *SELECT FUEL CLASSIFICATION TYPE* 🔥\n\nQuantity Captured: ${numericQty}\nChoose the burned fuel type by tapping an option below:` },
            action: {
                buttons: [
                    { type: "reply", reply: { id: `gas_type_1_${numericQty}`, title: "Natural Gas (Mains)" } },
                    { type: "reply", reply: { id: `gas_type_2_${numericQty}`, title: "LPG (Bottled Gas)" } }
                ]
            }
        };

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeTypeButtonsPayload);
        return true;
    }

    // INITIAL SUB-MENU LAUNCH ROUTINE
    if (choice === 'calc_opt_5' || choice === '5') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_GAS_QTY',
            pending_whatsapp_payload: {}
        }).eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "✏️ *GAS COMBUSTION SETUP* \n\nPlease enter the total fuel volume burned:\n\n*QUANTITY CAPACITY AMOUNT*");
        return true;
    }

    return false;
}
