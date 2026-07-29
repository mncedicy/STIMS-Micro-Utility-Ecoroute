import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
    // Create internal administrative bypass client using service keys
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { userId, userEmail, appId, amount } = await req.json();
        if (!userId || !userEmail || !appId || !amount) {
            return NextResponse.json({ success: false, error: "Missing identity reference parameters." }, { status: 400, headers: corsHeaders });
        }

        // Derive base domain URL pathing strings dynamically from requests
        const { origin: baseUrl } = new URL(req.url);

        // PRODUCTION CRITICAL ENV VARIABLE GUARD
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey || secretKey.trim() === "") {
            console.error("🚨 CRITICAL INITIALIZATION ERROR: PAYSTACK_SECRET_KEY is undefined on Vercel Production!");
            return NextResponse.json({
                success: false,
                error: "Server configuration parameter missing. The payment infrastructure secret key is not set on Vercel Production."
            }, { status: 500, headers: corsHeaders });
        }

        // Query monetization parameters dynamically from database catalogue table
        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id')
            .eq('app_id', appId)
            .maybeSingle();

        if (appQueryError) {
            console.warn(`[EcoRoute Billing Matrix]: Catalogue fetch trace warning: ${appQueryError.message}`);
        }

        const dynamicAmount = appConfig?.fee_amount_cents || amount;
        const globalPlanIdToken = appConfig?.paystack_plan_id ? appConfig.paystack_plan_id.trim() : null;

        console.log(`📡 Dispatched Paystack checkout authorization: User=${userEmail}, App=${appId}, Plan=${globalPlanIdToken || 'None'}`);

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({
                email: userEmail.trim().toLowerCase(),
                amount: dynamicAmount,
                currency: 'ZAR',
                callback_url: `${baseUrl}/dashboard?stims_app_id=${appId}`,
                ...(globalPlanIdToken && { plan: globalPlanIdToken }),
                metadata: {
                    user_id: userId,
                    app_id: appId,
                    tier: 'premium'
                },
                customer: {
                    metadata: {
                        user_id: userId,
                        custom_fields: [
                            {
                                variable_name: "user_id",
                                display_name: "User ID",
                                value: userId
                            }
                        ]
                    }
                }
            }),
            cache: 'no-store'
        });

        // ========================================================================
        // FAILSAFE TEXT PROCESSING MATRIX (PREVENTS NEXT.JS COMPILED BREAKS)
        // ========================================================================
        const rawTextResponse = await response.text();

        if (!rawTextResponse || rawTextResponse.trim() === "") {
            console.error(`❌ Paystack gateway returned a blank string token. Status Code: ${response.status}`);
            return NextResponse.json({
                success: false,
                error: `Payment infrastructure gateway returned an empty channel (Status ${response.status}). Check Vercel production keys configuration.`
            }, { status: 502, headers: corsHeaders });
        }

        let result;
        try {
            result = JSON.parse(rawTextResponse);
        } catch (parseError) {
            console.error("❌ Failed to parse response data string into a valid JSON schema model:", rawTextResponse);
            return NextResponse.json({
                success: false,
                error: `Gateway parameter compilation crash. Server returned non-JSON data stream error (Status ${response.status}).`
            }, { status: 502, headers: corsHeaders });
        }

        if (!response.ok || !result.status) {
            console.error("❌ Paystack integration link initialization transaction rejected:", JSON.stringify(result, null, 2));
            throw new Error(result.message || `Authorization rejected by Paystack gateway with status code ${response.status}.`);
        }

        return NextResponse.json({ success: true, url: result.data.authorization_url }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 EcoRoute Checkout Initialization Pipeline Fault:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
