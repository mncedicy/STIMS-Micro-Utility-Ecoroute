// src/app/api/v1/countries/route.js

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

    const { supabaseAdmin, corsHeaders } = authValidation;

    try {
        const url = new URL(req.url);
        const continent = url.searchParams.get('continent');

        let query = supabaseAdmin
            .from('ecoroute_static_countries')
            .select('id, code, name, continent');

        if (continent) {
            query = query.eq('continent', continent.toUpperCase().trim());
        }

        query = query.order('name', { ascending: true });

        const { data: countries, error: dbError } = await query;
        if (dbError) throw dbError;

        return sendApiResponse(req, {
            success: true,
            total_countries: countries?.length || 0,
            countries: countries || []
        }, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Country Fetch Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal country lookup disruption: ' + err.message }, corsHeaders, 500);
    }
}
