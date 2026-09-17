// src/app/api/v1/whatsapp/commandCalculations.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';
import { processConversationState } from './commandState';

export async function executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin }) {

    // FIXED: Query the applications app table and vehicles list lazily to populate the sub-module context arrays safely
    const appMetaResQuery = supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle();
    const vehiclesDbQuery = supabaseAdmin.from('ecoroute_vehicles').select('id, registration, registration_number, make, model, is_active').eq('user_id', userProfile.id);

    // FIXED: Read the active token fields to inspect current state flags before executing heavy database promises
    const tokenRecordQuery = await supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('id', tokenRecord.id).maybeSingle();
    const activeTokenRecord = tokenRecordQuery.data || tokenRecord;

    // FIXED: Run the conversation state checker at the absolute front gate to prevent empty responses on menu selections
    const stateHandled = await processConversationState({
        lowerMessage,
        userProfile,
        tokenRecord: activeTokenRecord,
        currentUsage,
        usageCap,
        businessPhoneNumberId,
        cleanPhoneNumber,
        supabaseAdmin,
        appMetaRes: null,
        activeVehicles: [],
        mockTokenQuery: { data: activeTokenRecord },
        mockProfRes: { data: userProfile }
    });

    if (stateHandled) return true;

    // Concurrently hydrate backend calculation data only if standalone text commands are being executed
    const [appMetaRes, vehiclesResult] = await Promise.all([appMetaResQuery, vehiclesDbQuery]);
    const activeVehicles = (vehiclesResult.data || []).filter(veh => veh.is_active !== false);
    const mockTokenQuery = { data: activeTokenRecord };
    const mockProfRes = { data: userProfile };

    // 2. Fallback standalone text parsing command patterns
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

    if (lowerMessage.startsWith('flight')) {
        const pattern = /^flight\s+(\d+)\s+([a-z]{3})\s+([a-z]{3})\s*(economy|business|first)?\$/i;
        const match = lowerMessage.match(pattern);
        if (!match) return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: flight [pax] [origin] [dest] [class]\nExample: flight 12 jnb cpt business");

        const [, passengers, origin, dest, flightClass] = match;
        const form = { type: 'flight', passengers: passengers.toString(), origin_iata: origin.trim().toUpperCase(), dest_iata: dest.trim().toUpperCase(), flight_class: flightClass || 'economy', save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('flight', form, activeTokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);
        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'flight', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Flight: ${origin.toUpperCase()} ➔ ${dest.toUpperCase()} (${flightClass || 'economy'})`, `${passengers} Pax`, payload, usageCap, currentUsage));
    }

    if (lowerMessage.startsWith('power')) {
        const pattern = /^power\s+(\d+(?:\.\d+)?)\s*([a-z]{2})\s*(utility_grid|diesel_generator|solar_pv)?\$/i;
        const match = lowerMessage.match(pattern);
        if (!match) return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: power [kwh] [country] [source]\nExample: power 250 za utility_grid");

        const [, kwh, country, powerSource] = match;
        const resolved = (powerSource || 'utility_grid').trim().toLowerCase();
        const form = { type: 'electricity', kwh: kwh.toString(), country_code: country.trim().toUpperCase(), power_source: resolved, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('electricity', form, activeTokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);
        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'electricity', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Electricity Grid (${country.toUpperCase()})`, `${kwh} kWh (${resolved})`, payload, usageCap, currentUsage));
    }

    if (lowerMessage.startsWith('shipping')) {
        const pattern = /^shipping\s+(\d+(?:\.\d+)?)\s*(kg|lbs|tonnes)\s+(\d+(?:\.\d+)?)\s*(km|miles)\s*(standard|road_heavy|road_light|rail|ocean)?\$/i;
        const match = lowerMessage.match(pattern);
        if (!match) return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: shipping [weight] [mass_unit] [dist][unit] [mode]\nExample: shipping 5 tonnes 850 km road_heavy");

        const [, weight, massUnit, distance, unit, shippingMode] = match;
        const mode = (shippingMode || 'standard').trim().toLowerCase();
        const form = { type: 'shipping', cargo_weight: weight.toString(), mass_unit: massUnit.toLowerCase(), distance: distance.toString(), unit: unit.toLowerCase(), shipping_mode: mode, save_log: true };
        const { calculatedKg, metadataLog } = await processCategoryEmissions('shipping', form, activeTokenRecord?.api_token || '');
        const payload = formatEmissionPayload(calculatedKg);
        await runEmissionsPipeline({ user: { id: userProfile.id }, cleanType: 'shipping', body: form, conversionsPayload: payload, metadataLog, appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL' });
        return sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Freight Logistics: ${mode.toUpperCase()}`, `${weight}${massUnit} across ${distance}${unit}`, payload, usageCap, currentUsage));
    }

    if (lowerMessage.startsWith('gas')) {
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
}
