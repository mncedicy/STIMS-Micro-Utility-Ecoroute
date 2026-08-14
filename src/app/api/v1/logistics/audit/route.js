// Updated API route handler with integrated real-time webhook checks
import { processCategoryEmissions } from '../../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { revalidatePath } from 'next/cache';
import { validateEmissionDate } from './apiValidationCore';
import { sanitizeCategoryPayload } from './apiPayloadMatrix';
import { dispatchCorporateWebhook } from '../../config/webhookDispatcher';
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

        let createdLogRecordId = null;
        let isDuplicateOverride = false;

        if (shouldSaveToDatabase) {
            if (incomingReferenceId) {
                const { data: existingMatch } = await supabaseAdmin
                    .from('ecoroute_emissions_logs')
                    .select('id')
                    .eq('user_id', tokenRecord.user_id)
                    .eq('batch_manifest_row_id', incomingReferenceId)
                    .maybeSingle();

                if (existingMatch) {
                    isDuplicateOverride = true;
                    createdLogRecordId = existingMatch.id;
                }
            }

            if (!isDuplicateOverride) {
                const { data: dbLogEntry, error: logError } = await supabaseAdmin
                    .from('ecoroute_emissions_logs')
                    .insert({
                        user_id: tokenRecord.user_id,
                        batch_manifest_row_id: incomingReferenceId,
                        vehicle_id: cleanType === 'vehicle' ? normalizedPayload.vehicle_id : null,
                        category_display: body.type.toUpperCase(),
                        carbon_kg: conversionsPayload.carbon_kg,
                        carbon_g: conversionsPayload.carbon_g,
                        carbon_mt: conversionsPayload.carbon_mt,
                        carbon_lb: conversionsPayload.carbon_lb,
                        input_distance: ['vehicle', 'shipping'].includes(cleanType) ? parseFloat(normalizedPayload.distance) : null,
                        input_unit: ['vehicle', 'shipping'].includes(cleanType) ? normalizedPayload.unit : null,
                        origin_iata: cleanType === 'flight' ? normalizedPayload.origin_iata.substring(0, 3).toUpperCase() : null,
                        dest_iata: cleanType === 'flight' ? normalizedPayload.dest_iata.substring(0, 3).toUpperCase() : null,
                        passengers_count: cleanType === 'flight' ? parseInt(normalizedPayload.passengers, 10) : null,
                        cargo_weight: cleanType === 'shipping' ? parseFloat(normalizedPayload.cargo_weight) : null,
                        mass_unit: cleanType === 'shipping' ? normalizedPayload.mass_unit : null,
                        energy_kwh: cleanType === 'electricity' ? parseFloat(normalizedPayload.kwh) : null,
                        country_code: cleanType === 'electricity' ? normalizedPayload.country_code.toUpperCase() : null,
                        gas_quantity: cleanType === 'gas' ? parseFloat(normalizedPayload.quantity) : null,
                        gas_type: cleanType === 'gas' ? normalizedPayload.gas_type : null,
                        gas_unit: cleanType === 'gas' ? normalizedPayload.gas_unit : null,
                        emission_date: inputEmissionDate,
                        log_source_channel: 'ENTERPRISE_API_TUNNEL',
                        raw_payload: {
                            ...conversionsPayload,
                            metadata: { ...metadataLog, userAssignedDate: inputEmissionDate, processedViaSecureTunnel: true }
                        }
                    })
                    .select().single();

                if (logError) throw logError;
                createdLogRecordId = dbLogEntry.id;
            }
        }

        const currentUsageCount = tokenRecord.current_monthly_usage || 0;
        const capacityLimitBounds = tokenRecord.usage_limit_cap || 100;
        const nextUsageCountValue = currentUsageCount + 1;

        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_monthly_usage: nextUsageCountValue, updated_at: new Date().toISOString() })
            .eq('user_id', tokenRecord.user_id);

        // --- ADDED WEBHOOK DISPATCH TRIGGERS (When saved to database successfully) ---
        if (shouldSaveToDatabase && !isDuplicateOverride) {
            const updatedUsageRatio = nextUsageCountValue / capacityLimitBounds;

            // 1. Quota Exhaustion Warning (95% threshold)
            if (updatedUsageRatio >= 0.95) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'quota_exhaustion_warning', {
                    threshold_reached: '95%',
                    message: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots.",
                    current_usage: nextUsageCountValue,
                    quota_limit: capacityLimitBounds
                });
            }

            // 2. Carbon Threshold Alert (85% sustainability budget cap check)
            const currentTaxLiabilityZar = parseFloat(tokenRecord.total_accrued_tax_liability_zar || 0) + (conversionsPayload.carbon_kg * 0.15); // example conversion factor
            const budgetCapZar = 20000.00;
            if (currentTaxLiabilityZar >= (budgetCapZar * 0.85)) {
                await dispatchCorporateWebhook(tokenRecord.user_id, 'carbon_threshold_alert', {
                    threshold_reached: '85%',
                    message: "Triggered immediately when aggregate corporate monthly carbon emissions cross 85% of your configured sustainability budget cap.",
                    accrued_tax_zar: currentTaxLiabilityZar,
                    threshold_limit_zar: budgetCapZar
                });
            }
        }

        try {
            revalidatePath('/');
            revalidatePath('/dashboard');
        } catch (cacheErr) {
            console.warn('[Cache Bypass]:', cacheErr.message);
        }

        return sendApiResponse(req, {
            success: true,
            status: shouldSaveToDatabase ? (isDuplicateOverride ? 'DUPLICATE_REFERENCE_SKIPPED' : 'TRANSACTION_AUDIT_VERIFIED') : 'CALCULATOR_ESTIMATE_ONLY',
            timestamp: new Date().toISOString(),
            organization: tokenRecord.organization_name,
            quota_requests_remaining: Math.max(0, capacityLimitBounds - nextUsageCountValue),
            is_duplicate_override: isDuplicateOverride,
            metrics: conversionsPayload,
            telemetry: { ...metadataLog, emissionDateApplied: inputEmissionDate, loggedToDatabase: shouldSaveToDatabase && !isDuplicateOverride },
            record: shouldSaveToDatabase ? { id: createdLogRecordId } : null
        }, corsHeaders, 200);

    } catch (err) {
        console.error('[Enterprise API Tunnel Error]:', err);
        return sendApiResponse(req, { error: 'Internal pipeline calculation exception: ' + err.message }, corsHeaders, 500);
    }
}
