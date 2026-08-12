// src/app/api/checkout/initialize/route.js

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
        const { userId, userEmail } = body;

        // FIXED SCOPE: Hardcoded EcoRoute app identifier globally, stripping incoming appId body dependencies
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

        // ========================================================================
        // PROFILE ENGINE LOOKUP
        // ========================================================================
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

        // ========================================================================
        // DYNAMIC MULTI-TENANT PLATFORM LOOKUP ENGINE (LOCKED TO ECOROUTE)
        // ========================================================================
        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id, monetization_type')
            .eq('app_id', AppId)
            .maybeSingle();

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

        // INITIALIZE PAYSTACK TRANSACTION VIA [Paystack API Integration](https://paystack.com)
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
                        {
                            variable_name: "user_id",
                            display_name: "User ID",
                            value: userId
                        },
                        {
                            variable_name: "app_id",
                            display_name: "App ID",
                            value: AppId
                        },
                        {
                            variable_name: "company_name",
                            display_name: "Company Name",
                            value: targetCompany
                        },
                        {
                            variable_name: "customer_name",
                            display_name: "Customer Name",
                            value: `${targetName} ${targetSurname}`.trim()
                        }
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
