// src/app/api/v1/whatsapp/vehicleDashboard.js

import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';
import { emailPdfReport } from '@/app/actions/email';

/**
 * Handles Option 5 (Fleet Assets) dashboard presentation and conditional email dispatches.
 */
export async function executeVehicleDashboardStep(contextPayload) {
    const { lowerMessage, userProfile, tokenRecord, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin, currentState } = contextPayload;

    const choice = String(lowerMessage || '').trim();
    const normalizedInputToken = choice.toLowerCase();

    // =========================================================================
    // STEP 2: EXECUTE STATELESS EMAIL PDF REPORT FOR THE SELECTED FLEET VEHICLE
    // =========================================================================
    if (currentState === 'AWAITING_FLEET_REPORT_EMAIL' || normalizedInputToken.startsWith('email-veh-')) {
        if (normalizedInputToken.startsWith('email-veh-')) {
            const targetVehicleUuid = choice.substring(10); // Extracts UUID suffix cleanly
            const targetEmail = userProfile?.email || '';

            await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: null, pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);

            if (!targetEmail) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Action Failed: No email address linked to your user profile table record row.");
                return true;
            }

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📧 Dispatching compliance audit trails spreadsheet for vehicle node to: *${targetEmail}*...`);

            try {
                const result = await emailPdfReport(targetEmail, 'BATCH_INDEX_SET_WHATSAPP', 'all', {
                    startDate: null,
                    endDate: null,
                    filterId: targetVehicleUuid, // Isolates this vehicle log view context
                    userId: userProfile.id
                });

                if (result?.success) {
                    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `✅ Success! Your corporate fleet compliance audit trail PDF has been generated and emailed.`);
                } else {
                    throw new Error(result?.error || 'Email distribution rejected by server transport agent.');
                }
            } catch (err) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Export Timeout: Failed to process backend report trigger loop (${err.message}).`);
            }
            return true;
        }
    }

    // =========================================================================
    // STEP 1: RENDER VEHICLE METRICS SUMMARY CARD WITH DYNAMIC FUEL VOLUME CONSUMED
    // =========================================================================
    if (currentState === 'AWAITING_FLEET_DASHBOARD_SELECTION' || normalizedInputToken.startsWith('fleet_dash_id_')) {
        const targetVehicleUuid = choice.replace('fleet_dash_id_', '');

        const { data: vehicleNode } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('*')
            .eq('id', targetVehicleUuid)
            .maybeSingle();

        if (!vehicleNode) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "❌ Vehicle profile node not found inside active record rows.");
            return true;
        }

        // Query historical ledger totals for this vehicle
        const { data: logs } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('carbon_kg, input_distance')
            .eq('user_id', userProfile.id)
            .eq('vehicle_id', targetVehicleUuid)
            .eq('print_status', 'included');

        const totalTrips = logs?.length || 0;
        const totalKg = (logs || []).reduce((sum, row) => sum + parseFloat(row.carbon_kg || 0), 0);
        const totalMt = totalKg / 1000;
        const totalKm = (logs || []).reduce((sum, row) => sum + parseFloat(row.input_distance || 0), 0);

        const vehicleScore = parseFloat(vehicleNode?.carbon_score || 0.205053);
        const avgCarbonPerKm = totalKm > 0 ? (totalKg / totalKm) : vehicleScore;

        // FIXED: Dynamically calculate total liquid fuel burned based on registered L/100km parameters (Default: 8.7 L/100km)
        const fuelEconomyL100km = parseFloat(vehicleNode?.fuel_economy_l100km || 8.7);
        const totalFuelUsedLitres = (totalKm * fuelEconomyL100km) / 100;

        const regName = String(vehicleNode?.registration_number || 'FLEET').toUpperCase();
        const makeName = String(vehicleNode?.make || 'VEHICLE').toUpperCase();
        const modelName = String(vehicleNode?.model || 'ASSET').toUpperCase();
        const fuelType = String(vehicleNode?.fuel_type || 'PREMIUM GASOLINE').toUpperCase();
        const engineSize = vehicleNode?.engine_size ? `${vehicleNode.engine_size}L` : '2.0L';

        // Format layout panel string mirroring your dashboard screenshots exactly
        const dashCardText =
            `🚘 *VEHICLE DETAILS [${regName}]* 🚘\n` +
            `• Profile: *${vehicleNode?.year || '2026'} ${makeName} ${makeName.includes(modelName) ? '' : modelName}*\n` +
            `• Class: *STANDARD VEHICLE | REAR-WHEEL DRIVE*\n\n` +
            `📋 *SPECIFICATIONS CONTEXT*:\n` +
            `• Engine Size: *${engineSize}*\n` +
            `• Fuel Classification: *${fuelType}*\n` +
            `• Fuel Economy Rating: *${fuelEconomyL100km.toFixed(1)} L/100km*\n` +
            `• Tailpipe CO₂ Multiplier: *${vehicleNode?.tailpipe_co2 || '205 g/km'}*\n` +
            `• Carbon Multiplier Key Score: *${vehicleScore.toFixed(6)} kg/km*\n\n` +
            `📊 *TOTAL CARBON SUMMARY HISTORY*:\n` +
            `• Total Logged Trips Count: *${totalTrips} tracked trips*\n` +
            `• Total Distance Driven: *${totalKm.toFixed(1)} KM*\n` +
            `• *Total Fuel Volume Used: ${totalFuelUsedLitres.toFixed(1)} Litres*\n` +
            `• Average Carbon Yield: *${avgCarbonPerKm.toFixed(4)} kg/km*\n` +
            `• *Total Accumulated Weight: ${totalKg.toFixed(1)} KG (${totalMt.toFixed(4)} Tons)*\n\n` +
            `👉 _Tap the action trigger down below to dispatch a signed compliance audit trail PDF file bundle directly to your profile email inbox account._`;

        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({
            current_whatsapp_state: 'AWAITING_FLEET_REPORT_EMAIL',
            pending_whatsapp_payload: { vehicleId: targetVehicleUuid }
        }).eq('id', tokenRecord.id);

        await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, {
            type: "button",
            body: { text: dashCardText },
            action: { buttons: [{ type: "reply", reply: { id: `email-veh-${targetVehicleUuid}`, title: "📧 Email PDF Report" } }] }
        });
        return true;
    }

    return false;
}
