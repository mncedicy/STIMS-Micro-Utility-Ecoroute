// /src/app/api/v1/logistics/audit/route.js
import { createClient } from '@supabase/supabase-js';
import { processCategoryEmissions } from '../../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { revalidatePath } from 'next/cache';
import { validateEmissionDate } from './apiValidationCore';
import { sanitizeCategoryPayload } from './apiPayloadMatrix';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        if (!authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Authentication Failed: Missing or malformed Authorization Bearer header.' }, { status: 401 });
        }
        const apiKeyToken = authHeader.substring(7).trim();

        // 1. Fetch token record independently of subscription state using the B2B key
        const { data: tokenRecord, error: tokenError } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('api_token', apiKeyToken)
            .maybeSingle();

        if (tokenError || !tokenRecord || !tokenRecord.is_active) {
            return Response.json({ error: 'Authorization Denied: Provided access signature credentials are invalid.' }, { status: 403 });
        }

        const currentUsageCount = tokenRecord.current_monthly_usage || 0;
        const capacityLimitBounds = tokenRecord.usage_limit_cap || 100;

        if (currentUsageCount >= capacityLimitBounds) {
            return Response.json({ error: `Quota Exceeded: Monthly transaction limits reached (${capacityLimitBounds} requests cap).` }, { status: 429 });
        }

        let body;
        try { body = await req.json(); } catch {
            return Response.json({ error: 'Bad Payload: Request body must be a valid JSON object.' }, { status: 400 });
        }

        if (!body.type) {
            return Response.json({ error: 'Validation Error: Field property "type" is mandatory.' }, { status: 400 });
        }

        const cleanType = body.type.toLowerCase();
        const allowedCategories = ['vehicle', 'flight', 'shipping', 'electricity', 'gas'];
        if (!allowedCategories.includes(cleanType)) {
            return Response.json({ error: `Validation Error: Unsupported category tier "${body.type}".` }, { status: 400 });
        }

        const inputEmissionDate = body.emission_date ? body.emission_date.toString().trim() : new Date().toISOString().split('T')[0];
        const dateValidationError = validateEmissionDate(inputEmissionDate);
        if (dateValidationError) {
            return Response.json({ error: dateValidationError }, { status: 400 });
        }

        const normalizedPayload = { ...body, emission_date: inputEmissionDate };
        const payloadValidationError = sanitizeCategoryPayload(cleanType, body, normalizedPayload);
        if (payloadValidationError) {
            return Response.json({ error: payloadValidationError }, { status: 400 });
        }

        // 2. Core Calculation Pipeline Execution
        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, normalizedPayload, apiKeyToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const shouldSaveToDatabase = body.save_log !== false;
        let createdLogRecordId = null;

        if (shouldSaveToDatabase) {
            const { data: dbLogEntry, error: logError } = await supabaseAdmin
                .from('ecoroute_emissions_logs')
                .insert({
                    user_id: tokenRecord.user_id,
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

        // 3. Increment quota count
        const nextUsageCountValue = currentUsageCount + 1;
        const { data: updatedTokenRecord } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_monthly_usage: nextUsageCountValue, updated_at: new Date().toISOString() })
            .eq('user_id', tokenRecord.user_id)
            .select().single();

        try {
            revalidatePath('/');
            revalidatePath('/dashboard');
        } catch (cacheErr) {
            console.warn('[Cache Bypass]:', cacheErr.message);
        }

        return Response.json({
            success: true,
            status: shouldSaveToDatabase ? 'TRANSACTION_AUDIT_VERIFIED' : 'CALCULATOR_ESTIMATE_ONLY',
            timestamp: new Date().toISOString(),
            organization: tokenRecord.organization_name,
            quota_requests_remaining: Math.max(0, capacityLimitBounds - nextUsageCountValue),
            metrics: conversionsPayload,
            telemetry: { ...metadataLog, emissionDateApplied: inputEmissionDate, loggedToDatabase: shouldSaveToDatabase },
            record: shouldSaveToDatabase ? { id: createdLogRecordId } : null
        }, { status: 200 });

    } catch (err) {
        console.error('[Enterprise API Tunnel Error]:', err);
        return Response.json({ error: 'Internal pipeline calculation exception: ' + err.message }, { status: 500 });
    }
}
