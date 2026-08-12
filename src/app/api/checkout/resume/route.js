// src/app/api/checkout/resume/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const AppId = 'ecoroute';
        const body = await req.json().catch(() => ({}));
        const userId = body.userId || body.user_id;

        if (!userId) {
            return NextResponse.json({ error: "Missing user identity reference parameter." }, { status: 400, headers: corsHeaders });
        }

        const { data: sub, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('app_id', AppId)
            .maybeSingle();

        if (subError) {
            return NextResponse.json({ error: `Database Ledger Query Error: ${subError.message}` }, { status: 500, headers: corsHeaders });
        }

        const paystackSubscriptionCode = (sub?.stripe_subscription_id || "").trim();
        const paystackEmailToken = (sub?.paystack_email_token || "").trim();

        if (!paystackSubscriptionCode || !paystackSubscriptionCode.startsWith('SUB_')) {
            return NextResponse.json({
                error: "No active subscription reference found to resume. Please subscribe from scratch.",
                requiresCheckout: true
            }, { status: 400, headers: corsHeaders });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Server misconfiguration parameter missing." }, { status: 500, headers: corsHeaders });
        }

        console.log(`📡 Relaying subscription resume request to Paystack for Code: ${paystackSubscriptionCode}`);

        // RESUME ENDPOINT URL with fallback matching your specification
        const targetResumeUrl = process.env.PAYSTACK_RESUME_URL || "https://api.paystack.co/subscription/enable";

        const paystackResponse = await fetch(targetResumeUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                code: paystackSubscriptionCode,
                token: paystackEmailToken
            }),
            cache: 'no-store'
        });

        const paystackResult = await paystackResponse.json();

        if (!paystackResponse.ok || !paystackResult.status) {
            const errorMsg = paystackResult.message || '';
            console.error("❌ Paystack Resume Pipeline Rejected:", JSON.stringify(paystackResult, null, 2));

            // Catch hard-cancelled state from Paystack and signal front-end to trigger new checkout
            if (errorMsg.toLowerCase().includes('cancelled') || errorMsg.toLowerCase().includes('cannot be reactivated')) {
                return NextResponse.json({
                    error: "This subscription has fully expired and cannot be resumed directly. Please initialize a new checkout session.",
                    requiresCheckout: true
                }, { status: 422, headers: corsHeaders });
            }

            return NextResponse.json({
                error: `Paystack Re-activation Failed: ${errorMsg || 'Verification mismatch error.'}`
            }, { status: 502, headers: corsHeaders });
        }

        return NextResponse.json({
            success: true,
            message: "Re-activation command sent to Paystack. Database will sync automatically when the webhook is received."
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 Subscription Resume API Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
