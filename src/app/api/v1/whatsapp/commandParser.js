// src/app/api/v1/whatsapp/commandParser.js

import { processCategoryEmissions } from '@/app/api/estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { runEmissionsPipeline } from '@/app/api/estimates/pipelineService';
import { sendMetaWhatsappMessage } from './metaClient';
import { buildAuditCardString } from './messageTemplates';

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

    // 1. VEHICLE: vehicle [distance]km [vehicle_id]
    if (incomingMessage.startsWith('vehicle')) {
        const pattern = /^vehicle\s+(\d+(?:\.\d+)?)\s*(km|miles)\s+([a-f0-9-]+)$/i;
        const match = incomingMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: vehicle [distance][unit] [vehicle_id]\nExample: vehicle 45km abc-123");
            return;
        }

        const [, distance, unit, vehicleId] = match;
        const computationForm = { type: 'vehicle', distance: parseFloat(distance), unit: unit.toLowerCase(), vehicle_id: vehicleId, save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('vehicle', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'vehicle', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Vehicle: ${metadataLog.vehicleProfile || vehicleId}`, `${distance} ${unit.toUpperCase()}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 2. FLIGHT: flight [passengers] [origin_iata] [dest_iata] [class]
    if (incomingMessage.startsWith('flight')) {
        const pattern = /^flight\s+(\d+)\s+([a-z]{3})\s+([a-z]{3})\s*(economy|business|first)?$/i;
        const match = incomingMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: flight [pax] [origin] [dest] [class]\nExample: flight 1 jnb cpt business");
            return;
        }

        const [, passengers, origin, dest, flightClass] = match;
        const computationForm = { type: 'flight', passengers: parseInt(passengers, 10), origin_iata: origin.toUpperCase(), dest_iata: dest.toUpperCase(), flight_class: flightClass || 'economy', save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('flight', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'flight', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Flight: ${origin.toUpperCase()} ➔ ${dest.toUpperCase()} (${flightClass || 'economy'})`, `${passengers} Pax`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 3. ELECTRICITY: power [kwh] [country_code] [source]
    if (incomingMessage.startsWith('power')) {
        const pattern = /^power\s+(\d+(?:\.\d+)?)\s*([a-z]{2})\s*(utility_grid|diesel_generator|solar_pv)?$/i;
        const match = incomingMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: power [kwh] [country] [source]\nExample: power 250 za utility_grid");
            return;
        }

        const [, kwh, country, powerSource] = match;
        const computationForm = { type: 'electricity', kwh: parseFloat(kwh), country_code: country.toUpperCase(), power_source: powerSource || 'utility_grid', save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('electricity', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'electricity', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Electricity Grid (${country.toUpperCase()})`, `${kwh} kWh (${powerSource || 'utility_grid'})`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 4. SHIPPING: shipping [weight] [mass_unit] [dist][unit] [mode]
    if (incomingMessage.startsWith('shipping')) {
        const pattern = /^shipping\s+(\d+(?:\.\d+)?)\s*(kg|lbs|tonnes)\s+(\d+(?:\.\d+)?)\s*(km|miles)\s*(standard|road_heavy|road_light|rail|ocean)?$/i;
        const match = incomingMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: shipping [weight] [mass_unit] [dist][unit] [mode]\nExample: shipping 5 tonnes 850 km road_heavy");
            return;
        }

        const [, weight, massUnit, distance, unit, shippingMode] = match;
        const computationForm = { type: 'shipping', cargo_weight: parseFloat(weight), mass_unit: massUnit.toLowerCase(), distance: parseFloat(distance), unit: unit.toLowerCase(), shipping_mode: shippingMode || 'standard', save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('shipping', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'shipping', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Freight Logistics: ${shippingMode || 'standard'}`, `${weight}${massUnit} across ${distance}${unit}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // 5. GAS: gas [quantity] [type] [unit]
    if (incomingMessage.startsWith('gas')) {
        const pattern = /^gas\s+(\d+(?:\.\d+)?)\s*(natural_gas|lpg)\s+(m3|kwh|liter|kg)$/i;
        const match = incomingMessage.match(pattern);

        if (!match) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "💡 Format Error.\n\nUse: gas [quantity] [type] [unit]\nExample: gas 120 natural_gas m3");
            return;
        }

        const [, quantity, gasType, gasUnit] = match;
        const computationForm = { type: 'gas', quantity: parseFloat(quantity), gas_type: gasType.toUpperCase(), gas_unit: gasUnit.toLowerCase(), save_log: true };

        const { calculatedKg, metadataLog } = await processCategoryEmissions('gas', computationForm, tokenRecord?.api_token || '');
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        await runEmissionsPipeline({
            user: { id: userProfile.id }, cleanType: 'gas', body: computationForm, conversionsPayload, metadataLog,
            appMetaRes, tokenQuery: mockTokenQuery, profRes: mockProfRes, currentUsageCount: currentUsage, logSourceChannel: 'WHATSAPP_META_TUNNEL'
        });

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, buildAuditCardString(userProfile.first_name, `Gas Combustion: ${gasType.toUpperCase()}`, `${quantity} ${gasUnit.toUpperCase()}`, conversionsPayload, usageCap, currentUsage));
        return;
    }

    // Global Help Menu Interactive Prompt
    const defaultHelpString =
        `👋 Hello ${userProfile.first_name || 'there'}!\nWelcome to EcoRoute Mobile Audit Sync.\n\n` +
        `To calculate and save compliance ledger audits instantly, reply using commands:\n\n` +
        `🚚 *Vehicle:* vehicle [dist]km [vehicle_id]\n` +
        `✈️ *Flight:* flight [pax] [origin_iata] [dest_iata]\n` +
        `⚡ *Electricity:* power [kwh] [country_code]\n` +
        `📦 *Freight:* shipping [weight] [unit] [dist]km\n` +
        `🔥 *Gas:* gas [qty] [natural_gas|lpg] [unit]`;

    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, defaultHelpString);
}
