// src/app/api/checkout/resume/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// STIMS Dynamic Domain Whitelist Matrix Framework
const ALLOWED_ORIGINS = [
    'https://stims.co.za',     // Production Application Domain
    'https://qa.stims.co.za',  // QA Staging Sandbox Subdomain
    'http://localhost:3000',            // Local Development Engine Workspace
    'http://localhost:3001',            // Local Development Engine Workspace
    'http://127.0.0.1:3000',             // Alternative Local Address
    'http://127.0.0.1:3001'             // Alternative Local Address
];

function getCorsHeaders(req) {
    const origin = req.headers.get('origin');
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
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
        const AppId = 'ecoroute';
        const body = await req.json().catch(() => ({}));
        const userId = body.userId || body.user_id;

        if (!userId) {
            return NextResponse.json({ error: "Missing identity reference parameters." }, { status: 400, headers: corsHeaders });
        }

        // 1. Locate current subscription parameters for the user
        const { data: sub, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('app_id', AppId)
            .maybeSingle();

        if (subError) {
            return NextResponse.json({ error: `Database Ledger Query Error: ${subError.message}` }, { status: 500, headers: corsHeaders });
        }

        let paystackSubscriptionCode = (sub?.stripe_subscription_id || "").trim();
        let paystackEmailToken = (sub?.paystack_pay_token || sub?.paystack_email_token || "").trim();

        // 2. Wildcard fallback ledger check if profile values are missing
        if (!paystackSubscriptionCode || !paystackEmailToken) {
            const { data: ledgerEntries } = await supabaseAdmin
                .from('billing_transactions_ledger')
                .select('paystack_subscription_code, raw_payload')
                .eq('user_id', userId)
                .eq('app_id', AppId)
                .not('raw_payload', 'is', null)
                .order('created_at', { ascending: false });

            if (ledgerEntries && ledgerEntries.length > 0) {
                for (const entry of ledgerEntries) {
                    const code = (entry.paystack_subscription_code || entry.raw_payload?.data?.subscription_code || "").trim();
                    const token = (entry.raw_payload?.data?.email_token || "").trim();
                    if (code && code.startsWith('SUB_')) paystackSubscriptionCode = code;
                    if (token) paystackEmailToken = token;
                    if (paystackSubscriptionCode && paystackEmailToken) break;
                }
            }
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Server configuration parameter missing." }, { status: 500, headers: corsHeaders });
        }

        if (!paystackSubscriptionCode || !paystackEmailToken) {
            return NextResponse.json({ error: "No active or resumable Paystack subscription code found." }, { status: 400, headers: corsHeaders });
        }

        // 3. Hit Paystack's enable/resume endpoint
        const paystackResponse = await fetch("https://paystack.co", {
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
            return NextResponse.json({
                error: `Paystack Resume Rejected: ${paystackResult.message || 'Unable to re-enable renewals.'}`
            }, { status: 502, headers: corsHeaders });
        }

        // 4. Update local DB status back to active immediately
        await supabaseAdmin
            .from('user_subscriptions')
            .update({
                status: 'active',
                cancel_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('app_id', AppId);

        return NextResponse.json({
            success: true,
            message: "Subscription auto-renewal successfully resumed."
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 Resume Route Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
