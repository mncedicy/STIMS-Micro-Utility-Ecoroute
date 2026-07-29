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
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const body = await req.json();

        // FLEXIBLE EXT_ALLOCATOR LAYER:
        // Safely extracts identity references from flat keys OR nested user object payloads seamlessly
        const targetUserId = body.userId || body.user?.id || body.user_id;
        const targetUserEmail = body.userEmail || body.user?.email || body.email;
        const targetAppId = body.appId || body.app_id;
        const targetAmount = body.amount;

        // Validation rule validation guard line
        if (!targetUserId || !targetUserEmail || !targetAppId || !targetAmount) {
            console.error("🚨 Checkout Payload Rejection: Missing tracking parameters inside payload properties:", JSON.stringify(body, null, 2));
            return NextResponse.json({
                success: false,
                error: `Missing identity reference parameters. Received: User ID: "${targetUserId ? 'Present' : 'Missing'}", Email: "${targetUserEmail ? 'Present' : 'Missing'}", App ID: "${targetAppId ? 'Present' : 'Missing'}", Amount: "${targetAmount ? 'Present' : 'Missing'}"`
            }, { status: 400, headers: corsHeaders });
        }

        // Derive base URL paths dynamically directly from incoming requests
        const { origin: baseUrl } = new URL(req.url);

        // PRODUCTION ENVIRONMENT KEY SECURITY GUARD
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey || secretKey.trim() === "") {
            console.error("🚨 CRITICAL CONFIURGATION FAULT: PAYSTACK_SECRET_KEY is undefined on Vercel!");
            return NextResponse.json({
                success: false,
                error: "Server configuration parameter missing. The payment infrastructure secret key is not set on Vercel."
            }, { status: 500, headers: corsHeaders });
        }

        // Query application parameters dynamically from the database catalogue
        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id')
            .eq('app_id', targetAppId)
            .maybeSingle();

        if (appQueryError) {
            console.warn(`[Ecosystem Billing Guard]: Catalogue query trace warning: ${appQueryError.message}`);
        }

        const dynamicAmount = appConfig?.fee_amount_cents || targetAmount;
        const globalPlanIdToken = appConfig?.paystack_plan_id ? appConfig.paystack_plan_id.trim() : null;

        console.log(`📡 Initializing Paystack payment session for ${targetUserEmail}. Amount: ${dynamicAmount}. Plan Token: ${globalPlanIdToken || 'None'}`);

        // Dispatch transaction parameters directly to Paystack's endpoint
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({
                email: targetUserEmail.trim().toLowerCase(),
                amount: dynamicAmount,
                currency: 'ZAR',
                callback_url: `${baseUrl}/dashboard?stims_app_id=${targetAppId}`,
                ...(globalPlanIdToken && { plan: globalPlanIdToken }),
                metadata: {
                    user_id: targetUserId,
                    app_id: targetAppId,
                    tier: 'premium'
                },
                customer: {
                    metadata: {
                        user_id: targetUserId,
                        custom_fields: [
                            {
                                variable_name: "user_id",
                                display_name: "User ID",
                                value: targetUserId
                            }
                        ]
                    }
                }
            }),
            cache: 'no-store'
        });

        // FAILSAFE EMPTY RESPONSE PARSING GUARD (PREVENTS JSON CLASHES)
        const rawTextResponse = await response.text();

        if (!rawTextResponse || rawTextResponse.trim() === "") {
            console.error(`❌ Paystack gateway returned a completely blank server response string. Status Code: ${response.status}`);
            return NextResponse.json({
                success: false,
                error: `Payment infrastructure gateway returned an empty response channel (Status ${response.status}). Check production environment key variables.`
            }, { status: 502, headers: corsHeaders });
        }

        let result;
        try {
            result = JSON.parse(rawTextResponse);
        } catch (parseError) {
            console.error("❌ Failed to parse response text strings as valid JSON object structure:", rawTextResponse);
            return NextResponse.json({
                success: false,
                error: `Gateway returned corrupted non-JSON parameters block (Status ${response.status}). Verify operational channel status maps.`
            }, { status: 502, headers: corsHeaders });
        }

        if (!response.ok || !result.status) {
            console.error("❌ Paystack initialization transaction structure rejected:", JSON.stringify(result, null, 2));
            throw new Error(result.message || `Authorization rejected by Paystack gateway with status code ${response.status}.`);
        }

        return NextResponse.json({ success: true, url: result.data.authorization_url }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 EcoRoute Checkout Initialization Loop Fault:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
