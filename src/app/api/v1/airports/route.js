// src/app/api/v1/airports/route.js

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
        const isoCountry = url.searchParams.get('iso_country');
        const searchQuery = url.searchParams.get('search');

        const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
        const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);

        const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
        const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
            .from('ecoroute_static_airports')
            .select('id, name, latitude, longitude, continent, iso_country, municipality', { count: 'exact' });

        if (continent) {
            query = query.eq('continent', continent.toUpperCase().trim());
        }
        if (isoCountry) {
            query = query.eq('iso_country', isoCountry.toUpperCase().trim());
        }
        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,municipality.ilike.%${searchQuery}%`);
        }

        query = query.range(offset, offset + limit - 1).order('name', { ascending: true });

        const { data: airports, count, error: dbError } = await query;
        if (dbError) throw dbError;

        return sendApiResponse(req, {
            success: true,
            pagination: {
                total_records: count || 0,
                current_page: page,
                per_page: limit,
                total_pages: Math.ceil((count || 0) / limit)
            },
            airports: airports || []
        }, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Airport Fetch Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal airport lookup disruption: ' + err.message }, corsHeaders, 500);
    }
}
