// src/app/api/v1/logistics/audit/route.js

import { processCategoryEmissions } from '../../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { validateEmissionDate } from './apiValidationCore';
import { sanitizeCategoryPayload } from './apiPayloadMatrix';
import { runEmissionsPipeline } from '../../../estimates/pipelineService';
import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    sendApiResponse
} from '../../config/apiConfig';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

export async function POST(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: true });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { supabaseAdmin, tokenRecord, apiKeyToken, corsHeaders } = authValidation;

    try {
        let body;
        try { body = await req.json(); } catch {
            return sendApiResponse(req, { error: 'Bad Payload: Request body must be a valid JSON object.' }, corsHeaders, 400);
        }

        if (!body.type) {
            return sendApiResponse(req, { error: 'Validation Error: Field property "type" is mandatory.' }, corsHeaders, 400);
        }

        const cleanType = body.type.toLowerCase();
        const allowedCategories = ['vehicle', 'flight', 'shipping', 'electricity', 'gas'];
        if (!allowedCategories.includes(cleanType)) {
            return sendApiResponse(req, { error: `Validation Error: Unsupported category tier "${body.type}".` }, corsHeaders, 400);
        }

        const inputEmissionDate = body.emission_date ? body.emission_date.toString().trim() : new Date().toISOString().split('T')[0];
        const dateValidationError = validateEmissionDate(inputEmissionDate);
        if (dateValidationError) {
            return sendApiResponse(req, { error: dateValidationError }, corsHeaders, 400);
        }

        const normalizedPayload = { ...body, emission_date: inputEmissionDate };
        const payloadValidationError = sanitizeCategoryPayload(cleanType, body, normalizedPayload);
        if (payloadValidationError) {
            return sendApiResponse(req, { error: payloadValidationError }, corsHeaders, 400);
        }

        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, normalizedPayload, apiKeyToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const shouldSaveToDatabase = body.save_log === true;
        const incomingReferenceId = body.reference_id ? String(body.reference_id).trim() : null;

        let responseData = null;
        let isDuplicateOverride = false;

        if (shouldSaveToDatabase) {
            // Fetch necessary dependency rows required by the central processing pipeline engine
            const [appMetaRes, profRes] = await Promise.all([
                supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
                supabaseAdmin.from('profiles').select('*').eq('id', tokenRecord.user_id).maybeSingle()
            ]);

            // Formulate context objects to match standard pipeline signature structures
            const userContextMock = { id: tokenRecord.user_id };
            const tokenQueryMock = { data: tokenRecord };

            // Hand execution off cleanly to the central verified pipeline stream
            responseData = await runEmissionsPipeline({
                user: userContextMock,
                cleanType,
                body: normalizedPayload,
                conversionsPayload,
                metadataLog,
                appMetaRes,
                tokenQuery: tokenQueryMock,
                profRes,
                currentUsageCount: tokenRecord.current_monthly_usage || 0,
                incomingReferenceId,
                logSourceChannel: 'ENTERPRISE_API_TUNNEL'
            });

            isDuplicateOverride = responseData?.isDuplicateOverride || false;
        }

        const capacityLimitBounds = tokenRecord.usage_limit_cap || 100;
        const assignedUsageTotal = isDuplicateOverride
            ? (tokenRecord.current_monthly_usage || 0)
            : (tokenRecord.current_monthly_usage || 0) + 1;

        return sendApiResponse(req, {
            success: true,
            status: shouldSaveToDatabase ? (isDuplicateOverride ? 'DUPLICATE_REFERENCE_SKIPPED' : 'TRANSACTION_AUDIT_VERIFIED') : 'CALCULATOR_ESTIMATE_ONLY',
            timestamp: new Date().toISOString(),
            organization: tokenRecord.organization_name,
            quota_requests_remaining: Math.max(0, capacityLimitBounds - assignedUsageTotal),
            is_duplicate_override: isDuplicateOverride,
            metrics: conversionsPayload,
            telemetry: { ...metadataLog, emissionDateApplied: inputEmissionDate, loggedToDatabase: shouldSaveToDatabase && !isDuplicateOverride },
            record: shouldSaveToDatabase ? { id: responseData?.id || null } : null
        }, corsHeaders, 200);

    } catch (err) {
        console.error('[Enterprise API Tunnel Error]:', err);
        return sendApiResponse(req, { error: 'Internal pipeline calculation exception: ' + err.message }, corsHeaders, 500);
    }
}
