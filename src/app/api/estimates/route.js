// src/app/api/estimates/route.js

import { NextResponse } from 'next/server';
import { getEstimatesSupabaseClient } from '../estimates/supabaseClient';
import { processCategoryEmissions } from './categoryPipeline';
import { handleSpecialCategoryCalculations } from './interceptors';
import { runEmissionsPipeline } from './pipelineService';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
        const supabase = await getEstimatesSupabaseClient(bearerToken);
        let { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized user access' }, { status: 401 });

        const body = await req.json();
        if (!body.type) return NextResponse.json({ error: 'Calculation category parameter type is required' }, { status: 400 });

        const cleanType = body.type.toLowerCase();

        const interceptionResult = await handleSpecialCategoryCalculations({ cleanType, body, userId: user.id });
        if (interceptionResult.intercepted) {
            return interceptionResult.response;
        }

        const [appMetaRes, subRes, tokenQuery, profRes] = await Promise.all([
            supabaseAdmin.from('applications').select('*').eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('user_subscriptions').select('tier, status').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
            supabaseAdmin.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle(),
            supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle()
        ]);

        const currentUsageCount = tokenQuery.data?.current_monthly_usage || 0;
        if (currentUsageCount >= (tokenQuery.data?.usage_limit_cap || 100)) {
            return NextResponse.json({ error: 'Quota Blocked: Monthly request volume exhausted.' }, { status: 429 });
        }

        const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, body, bearerToken);
        const conversionsPayload = formatEmissionPayload(calculatedKg);

        const responseData = await runEmissionsPipeline({
            user,
            cleanType,
            body,
            conversionsPayload,
            metadataLog,
            appMetaRes,
            tokenQuery,
            profRes,
            currentUsageCount
        });

        return NextResponse.json({ success: true, data: responseData }, { status: 200 });
    } catch (error) {
        console.error("🚨 EcoRoute API Orchestrator Crash:", error.message);
        return NextResponse.json({ error: error.message || "Internal server computation failure." }, { status: 500 });
    }
}
