// src/app/api/v1/route-check/route.js

import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    getCachedResponse,
    setCachedResponse,
    sendApiResponse
} from '../config/apiConfig';
import { calculate } from '@/app/utils/dispatch/routeHelpers';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function POST(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: true });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { tokenRecord, corsHeaders } = authValidation;

    try {
        const requestUrl = req.url;
        const cachedData = getCachedResponse(requestUrl);
        if (cachedData) {
            corsHeaders['X-Cache'] = 'HIT';
            return sendApiResponse(req, cachedData, corsHeaders, 200);
        }

        const body = await req.json();
        const { vehicle_id, coordinates_string } = body;

        if (!vehicle_id || !coordinates_string || !Array.isArray(coordinates_string) || coordinates_string.length < 2) {
            return sendApiResponse(
                req,
                { error: 'Validation Fault: vehicle_id and coordinates_string array containing at least [departure, last_stop] are mandatory.' },
                corsHeaders,
                400
            );
        }

        // Execute calculation (handles usage update, vehicle checks, audit webhook, and quota warning)
        const result = await calculate(tokenRecord.user_id, vehicle_id, coordinates_string);

        if (result.error) {
            return sendApiResponse(req, { error: result.error }, corsHeaders, result.status || 400);
        }

        setCachedResponse(requestUrl, result.responsePayload);
        corsHeaders['X-Cache'] = 'MISS';

        return sendApiResponse(req, result.responsePayload, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Route Check Execution Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal dispatch verification error: ' + err.message }, corsHeaders, 500);
    }
}