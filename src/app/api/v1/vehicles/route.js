// src/app/api/v1/vehicles/route.js

import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    sendApiResponse
} from '../config/apiConfig';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function GET(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: false });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { supabaseAdmin, tokenRecord, corsHeaders } = authValidation;

    try {
        const url = new URL(req.url);
        const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
        const queryLimit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);

        const { data: vehicles, error: dbError } = await supabaseAdmin
            .from('ecoroute_vehicles')
            .select('*')
            .eq('user_id', tokenRecord.user_id)
            .order('created_at', { ascending: false })
            .limit(queryLimit);

        if (dbError) throw dbError;

        return sendApiResponse(req, {
            success: true,
            total_vehicles: vehicles.length,
            vehicles
        }, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Vehicle Fetch Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal vehicle lookup disruption: ' + err.message }, corsHeaders, 500);
    }
}
