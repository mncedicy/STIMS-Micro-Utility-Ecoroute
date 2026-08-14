// src/app/api/v1/config/apiConfig.js

import { createClient } from '@supabase/supabase-js';

// Add or adjust this export inside your apiConfig.js file:
export const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://ecoroute.stims.co.za',
    'https://ecoroute-qa.stims.co.za',
    process.env.NEXT_PUBLIC_APP_URL || '*'
];

// Ensure your existing helpers and constants remain exported:
export const CARBON_TAX_BASE_RATE_ZAR = 190.00;
export const STANDARD_FREE_ALLOWANCE_EXEMPTION = 0.60;

// Simple in-memory storage fallback for rate limiting and response caching
const rateLimitStore = new Map();
const responseCacheStore = new Map();

/**
 * Generates standard secure CORS and identification headers.
 */
export function getCorsHeaders(req) {
    const origin = req.headers.get('origin') || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

/**
 * Handles HTTP OPTIONS preflight request configurations.
 */
export function handlePreflightOptions(req) {
    const headers = getCorsHeaders(req);
    return new Response(null, { status: 204, headers });
}

/**
 * Formats and standardizes standard JSON API wrapper responses.
 */
export function sendApiResponse(req, data, corsHeaders, status = 200) {
    return Response.json(data, { status, headers: corsHeaders });
}

/**
 * Evaluates in-memory rate-limiting windows per token signature.
 */
export async function checkRateLimit(token) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 120; // Max requests per minute cap

    let record = rateLimitStore.get(token);
    if (!record || now - record.startTime > windowMs) {
        rateLimitStore.set(token, { count: 1, startTime: now });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * Retrieves cached response payloads if valid.
 */
export function getCachedResponse(urlKey) {
    const cached = responseCacheStore.get(urlKey);
    if (cached && Date.now() < cached.expireAt) {
        return cached.payload;
    }
    responseCacheStore.delete(urlKey);
    return null;
}

/**
 * Stores response entries into the temporary cache store.
 */
export function setCachedResponse(urlKey, payload, ttlMs = 5 * 60 * 1000) {
    responseCacheStore.set(urlKey, {
        payload,
        expireAt: Date.now() + ttlMs
    });
}

/**
 * Centralized token authentication, rate limit, and quota check wrapper.
 */
export async function authenticateAndValidateToken(req, { checkQuota = true } = {}) {
    const corsHeaders = getCorsHeaders(req);
    const authHeader = req.headers.get('authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
        return {
            errorResponse: sendApiResponse(req, { error: 'Authentication Failed: Missing or malformed Authorization Bearer header.' }, corsHeaders, 401),
            supabaseAdmin: null,
            tokenRecord: null,
            corsHeaders
        };
    }

    const apiKeyToken = authHeader.substring(7).trim();

    if (!await checkRateLimit(apiKeyToken)) {
        return {
            errorResponse: sendApiResponse(req, { error: 'Rate Limit Exceeded: Too many requests. Please try again shortly.' }, corsHeaders, 429),
            supabaseAdmin: null,
            tokenRecord: null,
            corsHeaders
        };
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        const { data: tokenRecord, error: tokenError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('api_token', apiKeyToken)
            .maybeSingle();

        if (tokenError || !tokenRecord || !tokenRecord.is_active) {
            return {
                errorResponse: sendApiResponse(req, { error: 'Authorization Denied: Provided access signature credentials are invalid.' }, corsHeaders, 403),
                supabaseAdmin: null,
                tokenRecord: null,
                corsHeaders
            };
        }

        if (checkQuota) {
            const currentUsageCount = tokenRecord.current_monthly_usage || 0;
            const capacityLimitBounds = tokenRecord.usage_limit_cap || 100;

            if (currentUsageCount >= capacityLimitBounds) {
                return {
                    errorResponse: sendApiResponse(req, { error: `Quota Exceeded: Monthly transaction limits reached (${capacityLimitBounds} requests cap).` }, corsHeaders, 429),
                    supabaseAdmin: null,
                    tokenRecord: null,
                    corsHeaders
                };
            }
        }

        return { errorResponse: null, supabaseAdmin, tokenRecord, apiKeyToken, corsHeaders };
    } catch (err) {
        return {
            errorResponse: sendApiResponse(req, { error: 'Internal validation error: ' + err.message }, corsHeaders, 500),
            supabaseAdmin: null,
            tokenRecord: null,
            corsHeaders
        };
    }
}
