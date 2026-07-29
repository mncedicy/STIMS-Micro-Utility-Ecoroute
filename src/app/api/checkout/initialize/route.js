import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { userId, userEmail, name, surname, company } = await req.json();

        if (!userId || !userEmail) {
            return NextResponse.json({ success: false, error: "Missing identity tokens." }, { status: 400 });
        }

        const { origin: baseUrl } = new URL(req.url);
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ success: false, error: "PAYSTACK_SECRET_KEY missing from configurations." }, { status: 500 });
        }

        const { data: appConfig, error: appQueryError } = await supabaseAdmin
            .from('applications')
            .select('fee_amount_cents, paystack_plan_id')
            .eq('app_id', 'ecoroute')
            .maybeSingle();

        if (appQueryError || !appConfig) {
            console.warn(`[Ecosystem Billing Guard]: Registry entry for ecoroute unavailable.`);
        }

        const dynamicCurrency = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "ZAR";
        const dynamicAmount = appConfig?.fee_amount_cents || (process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AMOUNT_CENTS ? parseInt(process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AMOUNT_CENTS, 10) : 28000);
        const globalPlanIdToken = appConfig?.paystack_plan_id || (process.env.PAYSTACK_GLOBAL_PLAN_ID || "PLN_ka0bww33swkznc9");

        if (!globalPlanIdToken) {
            throw new Error("No active Paystack Plan ID token has been configured for this module.");
        }

        // Dispatch payload initialization mapping.
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail.trim().toLowerCase(),
                amount: dynamicAmount,
                currency: dynamicCurrency.toUpperCase(),
                callback_url: `${baseUrl}?stims_app_id=ecoroute`,
                plan: globalPlanIdToken.trim(),
                metadata: {
                    user_id: userId,
                    app_id: "ecoroute",
                    tier: "premium",
                    name: name?.trim() || "",
                    surname: surname?.trim() || "",
                    company: company?.trim() || ""
                },
                customer: {
                    first_name: name?.trim() || "",
                    last_name: surname?.trim() || "",
                    metadata: {
                        user_id: userId
                    }
                }
            }),
            cache: 'no-store'
        });

        const result = await response.json();
        if (!result.status) throw new Error(result.message || "Paystack initialization rejected.");

        // REMOVED: Database user_subscriptions entry writing logic has been relocated to the webhook processor.
        return NextResponse.json({ success: true, url: result.data.authorization_url });

    } catch (error) {
        console.error("🚨 EcoRoute Checkout Route Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
