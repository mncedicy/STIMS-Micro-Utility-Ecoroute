// File Location: src/app/api/v1/whatsapp/commandParser.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';
import { displayWhatsappMainMenu } from './commandMenu';

/**
 * Evaluates text strings via cryptographic boundaries and hands variables off to tracking logs.
 */
export async function handleIncomingCommand({
    incomingMessage,
    userProfile,
    tokenRecord,
    currentUsage,
    usageCap,
    businessPhoneNumberId,
    cleanPhoneNumber,
    supabaseAdmin
}) {
    const [appMetaRes] = await Promise.all([
        supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle()
    ]);
    const mockTokenQuery = { data: tokenRecord };
    const mockProfRes = { data: userProfile };

    const lowerMessage = String(incomingMessage || '').trim().toLowerCase();

    // 1. VEHICLE ROUTING CHANNEL
    if (lowerMessage.startsWith('vehicle')) {
        const pattern = /^vehicle\s+(\d+(?:\.\d+)?)\s*(km|miles)\s+([a-z0-9-]+)$/i;
        const match = lowerMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: vehicle [distance][unit] [vehicle_id]\nExample: vehicle 45km rrryyyii");
            return;
        }

        const [, distance, unit, vehicleId] = match;
        const computationForm = { type: 'vehicle', distance: distance.toString(), unit: unit.toLowerCase(), vehicle_id: vehicleId.trim(), save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'vehicle', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Vehicle: ${metadataLog?.vehicleProfile || vehicleId.toUpperCase()}`, `${distance} ${unit.toUpperCase()}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 2. FLIGHT TELESCOPIC CHANNEL
    if (lowerMessage.startsWith('flight')) {
        const pattern = /^flight\s+(\d+)\s+([a-z]{3})\s+([a-z]{3})\s*(economy|business|first)?$/i;
        const match = lowerMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: flight [pax] [origin] [dest] [class]\nExample: flight 12 jnb cpt business");
            return;
        }

        const [, passengers, origin, dest, flightClass] = match;
        const computationForm = { type: 'flight', passengers: passengers.toString(), origin_iata: origin.trim().toUpperCase(), dest_iata: dest.trim().toUpperCase(), flight_class: flightClass || 'economy', save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('flight', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'flight', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Flight: ${origin.toUpperCase()} ➔ ${dest.toUpperCase()} (${flightClass || 'economy'})`, `${passengers} Pax`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 3. ELECTRICITY SCOPE BALANCER
    if (lowerMessage.startsWith('power')) {
        const pattern = /^power\s+(\d+(?:\.\d+)?)\s*([a-z]{2})\s*(utility_grid|diesel_generator|solar_pv)?$/i;
        const match = lowerMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: power [kwh] [country] [source]\nExample: power 250 za utility_grid");
            return;
        }

        const [, kwh, country, powerSource] = match;
        const resolvedSource = (powerSource || 'utility_grid').trim().toLowerCase();
        const computationForm = { type: 'electricity', kwh: kwh.toString(), country_code: country.trim().toUpperCase(), power_source: resolvedSource, save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('electricity', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'electricity', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Electricity Grid (${country.toUpperCase()})`, `${kwh} kWh (${resolvedSource})`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 4. FREIGHT LOGISTICS MATRIX CHANNEL
    if (lowerMessage.startsWith('shipping')) {
        const pattern = /^shipping\s+(\d+(?:\.\d+)?)\s*(kg|lbs|tonnes)\s+(\d+(?:\.\d+)?)\s*(km|miles)\s*(standard|road_heavy|road_light|rail|ocean)?$/i;
        const match = lowerMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: shipping [weight] [mass_unit] [dist][unit] [mode]\nExample: shipping 5 tonnes 850 km road_heavy");
            return;
        }

        const [, weight, massUnit, distance, unit, shippingMode] = match;
        const resolvedMode = (shippingMode || 'standard').trim().toLowerCase();
        const computationForm = { type: 'shipping', cargo_weight: weight.toString(), mass_unit: massUnit.toLowerCase(), distance: distance.toString(), unit: unit.toLowerCase(), shipping_mode: resolvedMode, save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('shipping', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'shipping', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Freight Logistics: ${resolvedMode.toUpperCase()}`, `${weight}${massUnit} across ${distance}${unit}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 5. STATIONARY GAS COMBUSTION 
    if (lowerMessage.startsWith('gas')) {
        const pattern = /^gas\s+(\d+(?:\.\d+)?)\s*(natural_gas|lpg)\s+(m3|kwh|liter|kg)$/i;
        const match = lowerMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: gas [quantity] [type] [unit]\nExample: gas 120 natural_gas m3");
            return;
        }

        const [, quantity, gasType, gasUnit] = match;
        const computationForm = { type: 'gas', quantity: quantity.toString(), gas_type: gasType.toUpperCase(), gas_unit: gasUnit.toLowerCase(), save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'gas', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${gasType.toUpperCase()}`, `${quantity} ${gasUnit.toUpperCase()}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // Default Fallback: Diverts raw text messages down to layout view templates
    await displayWhatsappMainMenu(businessPhoneNumberId, cleanPhoneNumber, userProfile);
}
