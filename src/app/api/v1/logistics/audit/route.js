// /src/app/api/logistics/import-csv/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processCategoryEmissions } from '../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { parseCSVTextToJSON } from './csvTextEngine';
import { sanitizeCountryCode } from './parameterGuard';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
        const isStrictValidationMode = req.headers.get('x-strict-validation') === 'true';

        // Validate active session
        const { data: { user }, error: authError } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        ).auth.getUser(bearerToken);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized user access credentials.' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'Missing attachment file parameter.' }, { status: 400 });
        }

        const rawText = await file.text();
        const parsedRows = parseCSVTextToJSON(rawText);

        if (parsedRows.length === 0) {
            return NextResponse.json({ error: 'Spreadsheet contains empty blocks or missing header criteria.' }, { status: 400 });
        }

        // Fetch user quotas limits
        const { data: tokenRecord } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        let currentUsage = tokenRecord?.current_monthly_usage || 0;
        const limitCap = tokenRecord?.usage_limit_cap || 100;

        if (currentUsage + parsedRows.length > limitCap && isStrictValidationMode) {
            return NextResponse.json({
                error: `Strict Batch Rejection: This spreadsheet contains ${parsedRows.length} transactions, which exceeds your remaining quota slot capacity (${limitCap - currentUsage} left).`
            }, { status: 429 });
        }

        // Pull existing logs indices to perform fast duplicate screening in non-strict mode
        const { data: existingLogs } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('batch_manifest_row_id')
            .eq('user_id', user.id)
            .not('batch_manifest_row_id', 'is', null);

        const existingRefIdsSet = new Set(existingLogs?.map(l => l.batch_manifest_row_id) || []);

        // FIXED INTERCEPTOR: Track Reference_IDs INSIDE this current file to catch duplicates before they hit the database
        const localFileRefIdsSet = new Set();

        const dynamicLogsPayloads = [];
        let rowsProcessedCount = 0;
        let skipErrorRowsCount = 0;
        let activeLineIndex = 1;

        for (const row of parsedRows) {
            activeLineIndex++;
            if (currentUsage >= limitCap && !isStrictValidationMode) break;

            const userProvidedRefId = row.reference_id || row.manifest_id || row.row_id;
            const uniqueReferenceKey = userProvidedRefId
                ? userProvidedRefId.trim()
                : `auto_line_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${activeLineIndex}`;

            // FIXED SIMPLE ENGLISH ERROR PROMPT: Catches matching values inside the same spreadsheet file instantly
            if (localFileRefIdsSet.has(uniqueReferenceKey)) {
                return NextResponse.json({
                    error: `Spreadsheet Error: You have used the Reference ID "${uniqueReferenceKey}" more than once in this file (checked near line ${activeLineIndex}). Please make sure every row has a completely different Reference ID number and try uploading again.`
                }, { status: 422 });
            }
            localFileRefIdsSet.add(uniqueReferenceKey);

            if (!isStrictValidationMode && existingRefIdsSet.has(uniqueReferenceKey)) {
                continue;
            }

            try {
                const type = row.type || row.category;
                if (!type) throw new Error('Mandatory tracking column "Type" is blank or missing.');

                const cleanType = type.toLowerCase().trim();
                const countryToken = sanitizeCountryCode(row.country || row.country_code);

                const computationForm = {
                    type: cleanType,
                    distance: row.distance || '0',
                    unit: row.unit || 'km',
                    vehicle_id: row.vehicle_id || null,
                    origin_iata: row.origin || row.origin_iata || null,
                    dest_iata: row.destination || row.dest_iata || null,
                    passengers: row.passengers || '1',
                    cargo_weight: row.cargo_weight || '0',
                    mass_unit: row.mass_unit || 'kg',
                    kwh: row.kwh || '0',
                    country_code: countryToken,
                    quantity: row.quantity || '0',
                    gas_type: row.gas_type || 'NATURAL_GAS',
                    gas_unit: row.gas_unit || 'm3'
                };

                const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, computationForm, bearerToken);
                const conversions = formatEmissionPayload(calculatedKg);

                const resolvedDate = row.date && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
                    ? row.date
                    : new Date().toISOString().split('T');

                dynamicLogsPayloads.push({
                    user_id: user.id,
                    vehicle_id: cleanType === 'vehicle' ? computationForm.vehicle_id : null,
                    category_display: cleanType.toUpperCase(),
                    carbon_kg: conversions.carbon_kg,
                    carbon_g: conversions.carbon_g,
                    carbon_mt: conversions.carbon_mt,
                    carbon_lb: conversions.carbon_lb,
                    input_distance: ['vehicle', 'shipping'].includes(cleanType) ? parseFloat(computationForm.distance) : null,
                    input_unit: ['vehicle', 'shipping'].includes(cleanType) ? computationForm.unit : null,
                    origin_iata: cleanType === 'flight' ? computationForm.origin_iata?.substring(0, 3).toUpperCase() : null,
                    dest_iata: cleanType === 'flight' ? computationForm.dest_iata?.substring(0, 3).toUpperCase() : null,
                    passengers_count: cleanType === 'flight' ? parseInt(computationForm.passengers, 10) : null,
                    cargo_weight: cleanType === 'shipping' ? parseFloat(computationForm.cargo_weight) : null,
                    mass_unit: cleanType === 'shipping' ? computationForm.mass_unit : null,
                    energy_kwh: cleanType === 'electricity' ? parseFloat(computationForm.kwh) : null,
                    country_code: countryToken,
                    gas_quantity: cleanType === 'gas' ? parseFloat(computationForm.quantity) : null,
                    gas_type: cleanType === 'gas' ? computationForm.gas_type : null,
                    gas_unit: cleanType === 'gas' ? computationForm.gas_unit : null,
                    emission_date: resolvedDate,
                    log_source_channel: 'SPREADSHEET_BATCH_UPLOAD',
                    batch_manifest_row_id: uniqueReferenceKey,
                    raw_payload: { ...conversions, metadata: metadataLog }
                });

                rowsProcessedCount++;
                currentUsage++;

            } catch (rowErr) {
                if (isStrictValidationMode) {
                    return NextResponse.json({
                        error: `Strict Validation Crash: Ingestion aborted. Line entry #${activeLineIndex} failed: ${rowErr.message}`
                    }, { status: 422 });
                }
                skipErrorRowsCount++;
            }
        }

        // Commit valid logs using upsert rules
        if (dynamicLogsPayloads.length > 0) {
            const { error: batchInsertError } = await supabaseAdmin
                .from('ecoroute_emissions_logs')
                .upsert(dynamicLogsPayloads, { onConflict: 'user_id, batch_manifest_row_id' });

            // FIXED SYSTEM RESTRICTION INTERCEPTOR: Translates raw database panic strings into simple, universal English
            if (batchInsertError) {
                if (batchInsertError.message?.includes('cannot affect row a second time')) {
                    return NextResponse.json({
                        error: "Upload Error: This spreadsheet contains duplicate Reference IDs for the same user. Please make sure every line has a unique ID number and try again."
                    }, { status: 400 });
                }
                throw batchInsertError;
            }

            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({ current_monthly_usage: currentUsage, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
        }

        return NextResponse.json({
            success: true,
            imported_records_count: rowsProcessedCount,
            skipped_failed_rows_count: skipErrorRowsCount,
            current_monthly_usage: currentUsage,
            limit_capacity_cap: limitCap
        }, { status: 200 });

    } catch (error) {
        console.error('🚨 [CSV Batch Ingestion Engine Crash]:', error.message);

        return NextResponse.json({ error: error.message || 'Internal batch parsing disruption.' }, { status: 500 });
    }
}
