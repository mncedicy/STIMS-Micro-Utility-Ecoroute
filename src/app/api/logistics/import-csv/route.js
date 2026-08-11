// /src/app/api/logistics/import-csv/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCSVTextToJSON } from './csvTextEngine';
import { processRowEntry } from './rowProcessor';

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

        // Fetch user quotas limits and applications variables concurrently
        const [appMetaRes, tokenRecord] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        let currentUsage = tokenRecord.data?.current_monthly_usage || 0;
        const limitCap = tokenRecord.data?.usage_limit_cap || 100;

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

        // Track Reference_IDs INSIDE this current file to catch duplicates before they hit the database
        const localFileRefIdsSet = new Set();

        const dynamicLogsPayloads = [];
        let rowsProcessedCount = 0;
        let skipErrorRowsCount = 0;
        let activeLineIndex = 1;
        let batchAccruedTaxAccumulator = 0;

        const taxRatePerTon = parseFloat(appMetaRes.data?.carbon_tax_rate_zar_per_tonne || 190.00);
        const freeAllowancePercent = parseFloat(appMetaRes.data?.carbon_tax_free_allowance_percentage || 60.00);

        for (const row of parsedRows) {
            activeLineIndex++;
            if (currentUsage >= limitCap && !isStrictValidationMode) break;

            try {
                // Call row processor sub-module cleanly
                const { logRecord, uniqueReferenceKey, rowAccruedTaxZar } = await processRowEntry({
                    row, user, bearerToken, file, activeLineIndex, taxRatePerTon, freeAllowancePercent
                });

                // Catches matching reference values inside the same spreadsheet file instantly
                if (localFileRefIdsSet.has(uniqueReferenceKey)) {
                    return NextResponse.json({
                        error: `Spreadsheet Error: You have used the Reference ID "${uniqueReferenceKey}" more than once in this file (checked near line ${activeLineIndex}). Please make sure every row has a completely different Reference ID number and try uploading again.`
                    }, { status: 422 });
                }
                localFileRefIdsSet.add(uniqueReferenceKey);

                if (!isStrictValidationMode && existingRefIdsSet.has(uniqueReferenceKey)) {
                    continue;
                }

                dynamicLogsPayloads.push(logRecord);
                batchAccruedTaxAccumulator += rowAccruedTaxZar;
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

            // Translates raw database panic strings into simple, universal English
            if (batchInsertError) {
                if (batchInsertError.message?.includes('cannot affect row a second time')) {
                    return NextResponse.json({
                        error: "Upload Error: This spreadsheet contains duplicate Reference IDs for the same user. Please make sure every line has a unique ID number and try again."
                    }, { status: 400 });
                }
                throw batchInsertError;
            }

            const baselineAccruedTaxZar = parseFloat(tokenRecord.data?.total_accrued_tax_liability_zar || 0.00);
            const totalUpdatedTaxLiabilityZar = baselineAccruedTaxZar + batchAccruedTaxAccumulator;

            await supabaseAdmin
                .from('ecoroute_corporate_api_tokens')
                .update({
                    current_monthly_usage: currentUsage,
                    total_accrued_tax_liability_zar: totalUpdatedTaxLiabilityZar,
                    updated_at: new Date().toISOString()
                })
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
