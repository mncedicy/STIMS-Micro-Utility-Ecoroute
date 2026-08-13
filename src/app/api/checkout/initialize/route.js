// src/app/api/checkout/initialize/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// STIMS Dynamic Domain Whitelist Matrix Framework
const ALLOWED_ORIGINS = [
    'https://stims.co.za',              // Production Corporate Domain
    'https://qa.stims.co.za',           // General QA Sandbox Subdomain
    'https://ecoroute.stims.co.za',     // App A Production Domain
    'https://ecoroute-qa.stims.co.za',  // App A QA Sandbox Domain
    'http://localhost:3000',            // Local Development Engine Workspace
    'http://localhost:3001',            // Local Development Engine Workspace alternative
    'http://127.0.0.1:3000',            // Local IP Loopback address
    'http://127.0.0.1:3001'             // Local IP Loopback alternative port
];

/**
 * Validates request origin against the dynamic whitelist and returns appropriate CORS headers
 */
function getCorsHeaders(req) {
    const origin = req.headers.get('origin');

    // Fallback headers configuration defaults
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // If the origin is explicitly included in our matrix array, reflect it securely
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
        // Enforce strict boundary rules if unmatched
        headers['Access-Control-Allow-Origin'] = 'https://stims.co.za';
    }

    return headers;
}

export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req)
    });
}

export async function POST(req) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const corsHeaders = getCorsHeaders(req);

    try {
        const body = await req.json();
        const { userId, userEmail } = body;

        const AppId = 'ecoroute';
        const finalCallbackUrl = body.callbackUrl || body.callback_url;

        if (!userId || !userEmail) {
            return NextResponse.json({ success: false, error: "Missing user identification parameters." }, { status: 400, headers: corsHeaders });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            console.error("🚨 Main Hub Checkout: PAYSTACK_SECRET_KEY is missing from environment variables.");
            return NextResponse.json({ success: false, error: "Server misconfiguration." }, { status: 500, headers: corsHeaders });
        }

        // Fetch corresponding user corporate profile details
        const { data: profileConfig, error: profileQueryError } = await supabaseAdmin
            .from('profiles')
            .select('first_name, surname, company')
            .eq('id', userId)
            .maybeSingle();

        if (profileQueryError) {
            console.warn(`[Hub Billing Guard]: Profile data fetch warning: ${profileQueryError.message}`);
        }

        const targetName = profileConfig?.first_name?.trim() || "";
        const targetSurname = profileConfig?.surname?.trim() || "";
        const targetCompany = profileConfig?.company?.trim() || "";

        // Dynamic multi-tenant platform lookup engine (Locked to ecoroute context)
        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id, monetization_type')
            .eq('app_id', AppId)
            .maybeSingle();


        const periodStart = new Date().toISOString();
        const calculatedEnd = new Date(periodStart);
        calculatedEnd.setDate(calculatedEnd.getDate() + 30);

        // Safe creation: Only initializes the default row if it doesn't already exist
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
                user_id: userId,
                app_id: AppId,
                status: 'inactive',
                tier: 'free',
                user_email: userEmail,
                current_period_start: periodStart,
                current_period_end: calculatedEnd.toISOString(),
                updated_at: new Date().toISOString()
            }, { ignoreDuplicates: true });

        if (error) {
            console.warn(`[Hub Billing Guard]: Subscription initialization insert notice: ${error.message}`);
        }


        if (appQueryError) {
            console.warn(`[Hub Billing Guard]: Database query trace warning: ${appQueryError.message}`);
        }

        if (appConfig?.monetization_type !== 'Paid') {
            return NextResponse.json({
                success: false,
                error: `This application cannot process payments. Current billing profile status type is '${appConfig?.monetization_type || 'Free'}'.`
            }, { status: 403, headers: corsHeaders });
        }

        const dynamicAmount = appConfig?.fee_amount_cents;
        if (!dynamicAmount) {
            return NextResponse.json({ success: false, error: "Price allocation missing for the EcoRoute configuration row." }, { status: 422, headers: corsHeaders });
        }

        const globalPlanIdToken = appConfig?.paystack_plan_id ? appConfig.paystack_plan_id.trim() : null;

        // Initialize Paystack transaction session parameters payload
        const response = await fetch(process.env.PAYSTACK_INITIALIZE_URL || "https://api.paystack.co/transaction/initialize", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail.trim().toLowerCase(),
                amount: dynamicAmount,
                currency: 'ZAR',
                callback_url: finalCallbackUrl,
                ...(globalPlanIdToken && { plan: globalPlanIdToken }),

                metadata: {
                    user_id: userId,
                    app_id: AppId,
                    tier: 'premium',
                    name: targetName,
                    surname: targetSurname,
                    company: targetCompany,
                    custom_fields: [
                        { variable_name: "user_id", display_name: "User ID", value: userId },
                        { variable_name: "app_id", display_name: "App ID", value: AppId },
                        { variable_name: "company_name", display_name: "Company Name", value: targetCompany },
                        { variable_name: "customer_name", display_name: "Customer Name", value: `${targetName} ${targetSurname}`.trim() }
                    ]
                }
            }),
            cache: 'no-store'
        });

        const result = await response.json();
        if (!result.status) throw new Error(result.message || "Paystack initialization failed.");

        return NextResponse.json({ success: true, url: result.data.authorization_url }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 Hub Initialization Route Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
