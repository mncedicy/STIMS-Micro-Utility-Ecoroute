import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3001',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const body = await req.json();

        // FLEXIBLE PARAMETER FALLBACK EXTRACTOR
        // Safely extracts parameter metrics whether sent flat or inside an outer nested user wrapper
        const targetUserId = body.userId || body.user?.id || body.user_id;
        const targetUserEmail = body.userEmail || body.user?.email || body.email;
        const targetName = body.name || body.user_metadata?.first_name || "";
        const targetSurname = body.surname || body.user_metadata?.surname || "";
        const targetCompany = body.company || body.user_metadata?.company || "";

        if (!targetUserId || !targetUserEmail) {
            console.error("🚨 EcoRoute Checkout Rejection: Missing identity parameters inside incoming payload properties.");
            return NextResponse.json({
                success: false,
                error: "Missing identity reference parameters. Required authentication fields are blank."
            }, { status: 400, headers: corsHeaders });
        }

        const { origin: baseUrl } = new URL(req.url);

        // PRODUCTION ENVIRONMENT VARIABLE GUARD
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey || secretKey.trim() === "") {
            console.error("🚨 CRITICAL ENV ERROR: PAYSTACK_SECRET_KEY is undefined on Vercel Production!");
            return NextResponse.json({
                success: false,
                error: "Server configuration parameter missing. The payment infrastructure secret key is not set on Vercel."
            }, { status: 500, headers: corsHeaders });
        }

        // Query application parameters dynamically from database catalogue table
        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id')
            .eq('app_id', 'ecoroute')
            .maybeSingle();

        if (appQueryError || !appConfig) {
            console.warn(`[Ecosystem Billing Guard]: Registry entry for ecoroute unavailable: ${appQueryError?.message}`);
        }

        const dynamicCurrency = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "ZAR";
        const dynamicAmount = appConfig?.fee_amount_cents || (process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AMOUNT_CENTS ? parseInt(process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AMOUNT_CENTS, 10) : 28000);
        const globalPlanIdToken = appConfig?.paystack_plan_id || (process.env.PAYSTACK_GLOBAL_PLAN_ID || "PLN_ka0bww33swkznc9");

        if (!globalPlanIdToken) {
            throw new Error("No active Paystack Plan ID token has been configured for this module.");
        }

        console.log(`📡 Dispatched EcoRoute Paystack transaction initialize for: ${targetUserEmail}`);

        // Dispatch transaction parameters directly to Paystack's endpoint
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: targetUserEmail.trim().toLowerCase(),
                amount: dynamicAmount,
                currency: dynamicCurrency.toUpperCase(),
                callback_url: `${baseUrl}?stims_app_id=ecoroute`,
                plan: globalPlanIdToken.trim(),
                metadata: {
                    user_id: targetUserId,
                    app_id: "ecoroute",
                    tier: "premium",
                    name: targetName?.trim() || "",
                    surname: targetSurname?.trim() || "",
                    company: targetCompany?.trim() || ""
                },
                customer: {
                    first_name: targetName?.trim() || "",
                    last_name: targetSurname?.trim() || "",
                    metadata: {
                        user_id: targetUserId
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
            console.error("❌ Paystack initialization transaction structure rejected:", JSON.stringify(result, null, 2));
            throw new Error(result.message || `Authorization rejected by Paystack gateway with status code ${response.status}.`);
        }

        return NextResponse.json({ success: true, url: result.data.authorization_url }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 EcoRoute Checkout Route Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
