// src/app/api/v1/tax-report/route.js

import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    getCachedResponse,
    setCachedResponse,
    sendApiResponse
} from '../config/apiConfig';
import { calculateTax } from '@/app/utils/dispatch/taxHelpers';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function GET(req) {
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

        const { searchParams } = new URL(requestUrl);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        // Execute tax calculation helper
        const result = await calculateTax(tokenRecord.user_id, startDate, endDate);

        if (result.error) {
            return sendApiResponse(req, { error: result.error }, corsHeaders, result.status || 400);
        }

        setCachedResponse(requestUrl, result.responsePayload);
        corsHeaders['X-Cache'] = 'MISS';

        return sendApiResponse(req, result.responsePayload, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [SARS Tax API Engine Crash]:', err.message);
        return sendApiResponse(req, { error: 'Internal server carbon tax evaluation failure: ' + err.message }, corsHeaders, 500);
    }
}