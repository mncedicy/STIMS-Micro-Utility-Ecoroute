// src/app/utils/dispatch/routeHelpers.js

import { updateUsage } from './tokenHelpers';
import { dispatchCorporateWebhook } from '@/app/api/v1/config/webhookDispatcher';
import { createClient } from '@supabase/supabase-js';

// Initialize admin bypass client to read vehicle metrics cleanly without RLS policies getting blocked
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Calculates the total sequential Haversine distance in KM from an array of coordinate strings ("lat,lon")
 */
export function calculateSequentialGoogleHaversine(coordinatesArray) {
    try {
        if (!Array.isArray(coordinatesArray) || coordinatesArray.length < 2) {
            return 482.6;
        }

        let cumulativeTotalKm = 0;
        const R = 6371; // Earth's radius in KM

        for (let i = 0; i < coordinatesArray.length - 1; i++) {
            const startParts = coordinatesArray[i].split(',');
            const endParts = coordinatesArray[i + 1].split(',');

            // FIXED: Added exact array index mappings to extract values correctly instead of passing arrays
            const lat1 = parseFloat(startParts[0]);
            const lon1 = parseFloat(startParts[1]);
            const lat2 = parseFloat(endParts[0]);
            const lon2 = parseFloat(endParts[1]);

            if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
                continue;
            }

            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);

            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            cumulativeTotalKm += R * c * 1.25; // Factoring a 25% transit route circuitry buffer
        }

        return parseFloat(cumulativeTotalKm.toFixed(1));
    } catch (e) {
        return 0;
    }
}

/**
 * Calculates route metrics and structures the API response payload
 */
export function calculateRoute({ coordinates_string, vehicleRecord, usageCap, nextUsageValue }) {
    const actualDistanceKm = calculateSequentialGoogleHaversine(coordinates_string);
    const carbonMultiplier = parseFloat(vehicleRecord.carbon_multiplier || 0.230);
    const actualCarbonKg = actualDistanceKm * carbonMultiplier;
    const actualFuelLitres = actualDistanceKm * 0.115;

    const responsePayload = {
        success: true,
        dispatch_status: 'APPROVED_HAVERSINE_SEQUENCE_ROUTE',
        vehicle_specs: {
            id: vehicleRecord.id,
            description: `${vehicleRecord.make} ${vehicleRecord.model} (${vehicleRecord.registration_number || 'Fleet Asset'})`,
            carbon_multiplier: carbonMultiplier
        },
        route_projection: {
            total_transit_points: coordinates_string.length,
            routing_engine: 'Haversine Geographic Array Tracker Matrix (Google Format)',
            actual_distance_km: actualDistanceKm,
            projected_fuel_litres: parseFloat(actualFuelLitres.toFixed(2)),
            projected_carbon_kg: parseFloat(actualCarbonKg.toFixed(3))
        },
        quota_requests_remaining: Math.max(0, usageCap - nextUsageValue)
    };

    return {
        actualDistanceKm,
        actualCarbonKg: parseFloat(actualCarbonKg.toFixed(3)),
        responsePayload
    };
}

/**
 * Checks usage, validates vehicle, calculates route metrics, and dispatches audit webhook.
 */
export async function calculate(user_id, vehicle_id, coordinates_string) {
    try {
        if (!Array.isArray(coordinates_string)) {
            return {
                error: 'Validation Fault: coordinates_string must be an array.',
                status: 400
            };
        }

        // 1. Check and update usage using the number of coordinates passed
        const usageResult = await updateUsage(user_id, coordinates_string.length);
        if (usageResult.exceeded) {
            return { error: usageResult.message, status: 429 };
        }

        // 2. Fetch and validate vehicle ownership using elevated Admin client roles
        const targetVehicleId = vehicle_id.trim();
        const { data: vehicleRecord, error: vehError } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('*')
            .eq('id', targetVehicleId)
            .eq('user_id', user_id)
            .eq('is_active', true)
            .maybeSingle();

        if (vehError || !vehicleRecord) {
            console.error(`[Route Check Diagnostics]: Vehicle lookup failed via Admin. Vehicle ID: "${targetVehicleId}", User ID: "${user_id}".`);
            return {
                error: `Resource Not Found: Specified vehicle_id is invalid or unauthorized. v ${targetVehicleId} u ${user_id}`,
                status: 404
            };
        }

        // 3. Calculate route metrics
        const { actualDistanceKm, actualCarbonKg, responsePayload } = calculateRoute({
            coordinates_string,
            vehicleRecord,
            usageCap: usageResult.usage_limit_cap,
            nextUsageValue: usageResult.value
        });

        // 4. Dispatch corporate audit webhook silently
        try {
            await dispatchCorporateWebhook(user_id, 'audit.route_calculated', {
                vehicle_id: targetVehicleId,
                distance_km: actualDistanceKm,
                projected_carbon_kg: actualCarbonKg,
                transit_points: coordinates_string.length
            });
        } catch (webhookErr) {
            console.warn('⚠️ [Route Check Webhook Dispatch Bypass]: Flow execution skipped:', webhookErr.message);
        }

        return {
            actualDistanceKm,
            actualCarbonKg,
            responsePayload
        };
    } catch (err) {
        return {
            error: err.message || 'An unexpected error occurred during route calculation.',
            status: 500
        };
    }
}
