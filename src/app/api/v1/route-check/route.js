// src/app/api/v1/route-check/route.js

import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    getCachedResponse,
    setCachedResponse,
    sendApiResponse
} from '../config/apiConfig';
import { dispatchCorporateWebhook } from '../config/webhookDispatcher';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

function calculateSequentialGoogleHaversine(coordinatesArray) {
    try {
        if (!Array.isArray(coordinatesArray) || coordinatesArray.length < 2) {
            return 482.6;
        }

        let cumulativeTotalKm = 0;
        const R = 6371;

        for (let i = 0; i < coordinatesArray.length - 1; i++) {
            const startParts = coordinatesArray[i].split(',');
            const endParts = coordinatesArray[i + 1].split(',');

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
            cumulativeTotalKm += R * c * 1.25;
        }

        return parseFloat(cumulativeTotalKm.toFixed(1));
    } catch (e) {
        return 482.6;
    }
}

export async function POST(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: true });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { supabaseAdmin, tokenRecord, corsHeaders } = authValidation;

    try {
        const currentUsage = tokenRecord.current_monthly_usage || 0;
        const usageCap = tokenRecord.usage_limit_cap || 100;
        const nextUsageValue = currentUsage + 1;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({
                current_monthly_usage: nextUsageValue,
                updated_at: new Date().toISOString()
            })
            .eq('id', tokenRecord.id);

        const requestUrl = req.url;
        const cachedData = getCachedResponse(requestUrl);
        if (cachedData) {
            corsHeaders['X-Cache'] = 'HIT';
            cachedData.quota_requests_remaining = Math.max(0, usageCap - nextUsageValue);
            return sendApiResponse(req, cachedData, corsHeaders, 200);
        }

        const body = await req.json();
        const { vehicle_id, coordinates_string } = body;

        if (!vehicle_id || !coordinates_string || !Array.isArray(coordinates_string) || coordinates_string.length < 2) {
            return sendApiResponse(req, { error: 'Validation Fault: vehicle_id and coordinates_string array containing at least [departure, last_stop] are mandatory.' }, corsHeaders, 400);
        }

        const { data: vehicleRecord, error: vehError } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('*')
            .eq('id', vehicle_id.trim())
            .eq('user_id', tokenRecord.user_id)
            .maybeSingle();

        if (vehError || !vehicleRecord) {
            return sendApiResponse(req, { error: 'Resource Not Found: Specified vehicle_id is invalid or unauthorized.' }, corsHeaders, 404);
        }

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

        // --- INTEGRATED LIVE WEBHOOK DISPATCH TRIGGERS ---
        try {
            await dispatchCorporateWebhook(tokenRecord.user_id, 'audit.route_calculated', {
                vehicle_id: vehicleRecord.id,
                distance_km: actualDistanceKm,
                projected_carbon_kg: parseFloat(actualCarbonKg.toFixed(3)),
                transit_points: coordinates_string.length
            });

            const updatedUsageRatio = nextUsageValue / usageCap;
            if (updatedUsageRatio >= 0.95 && (currentUsage / usageCap) < 0.95) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: nextUsageValue,
                    quota_limit: usageCap
                });
            }
        } catch (webhookErr) {
            console.warn('⚠️ [Route Check Webhook Dispatch Bypass]: Flow execution skipped:', webhookErr.message);
        }

        setCachedResponse(requestUrl, responsePayload);
        corsHeaders['X-Cache'] = 'MISS';

        return sendApiResponse(req, responsePayload, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Route Check Execution Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal dispatch verification error: ' + err.message }, corsHeaders, 500);
    }
}
