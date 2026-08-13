// src/app/api/checkout/cancel/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
            console.error("🚨 Cancellation Endpoint Rejection: Missing user tracking body context.");
            return NextResponse.json({ error: "Missing identity reference parameters." }, { status: 400, headers: corsHeaders });
        }

        // Locate the master subscription profile row for this user session inside public.user_subscriptions
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

        // Wildcard Ledger Extractor Backup Engine Lookup
        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.warn(`⚠️ Profile column empty for user ${userId}. Scanning history ledger for valid EcoRoute references...`);

            const { data: ledgerEntries, error: ledgerTraceError } = await supabaseAdmin
                .from('billing_transactions_ledger')
                .select('paystack_subscription_code, raw_payload')
                .eq('user_id', userId)
                .eq('app_id', AppId)
                .not('raw_payload', 'is', null)
                .order('created_at', { ascending: false });

            if (!ledgerTraceError && ledgerEntries && ledgerEntries.length > 0) {
                for (const entry of ledgerEntries) {
                    const codeCandidate = (entry.paystack_subscription_code || entry.raw_payload?.data?.subscription_code || "").trim();
                    const tokenCandidate = (entry.raw_payload?.data?.email_token || entry.raw_payload?.data?.customer?.metadata?.email_token || "").trim();

                    if (codeCandidate && codeCandidate.startsWith('SUB_')) {
                        paystackSubscriptionCode = codeCandidate;
                    }
                    if (tokenCandidate) {
                        paystackEmailToken = tokenCandidate;
                    }

                    if (paystackSubscriptionCode && paystackEmailToken) {
                        console.log(`✅ Success: Reconstructed subscription parameters using wildcard ledger scans.`);
                        break;
                    }
                }
            }
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            console.error("🚨 STIMS Billing: PAYSTACK_SECRET_KEY is missing from environment variables.");
            return NextResponse.json({ error: "Server configuration parameter missing from workspace." }, { status: 500, headers: corsHeaders });
        }

        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.error(`❌ Cancellation Aborted: Final parameters are empty or unresolved for EcoRoute. Code: "${paystackSubscriptionCode}", Token: "${paystackEmailToken}"`);
            return NextResponse.json({
                error: `Missing tracking keys. Checked user profile and history ledger rows, but no active 'SUB_' code was found. Please subscribe again to recreate valid keys.`
            }, { status: 400, headers: corsHeaders });
        }

        console.log(`📡 Relaying cancellation intent payload processing directly to Paystack API gateway for Code: ${paystackSubscriptionCode}`);

        const paystackResponse = await fetch(process.env.PAYSTACK_CANCEL_URL || "https://api.paystack.co/subscription/disable", {
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
            console.error("❌ Paystack Remote Disabling Pipeline Exception Returned:", JSON.stringify(paystackResult, null, 2));
            return NextResponse.json({
                error: `Paystack Gateway Cancellation Rejected: ${paystackResult.message || 'Verification mismatch context error.'}`
            }, { status: 502, headers: corsHeaders });
        }

        console.log(`[Paystack Gateway Forward Status Success]: Command processed for EcoRoute. Awaiting background webhook synchronization.`);

        return NextResponse.json({
            success: true,
            message: "Cancellation request acknowledged by Paystack. System account state properties will sync automatically upon webhook confirmation process."
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🚨 Cancellation Pipeline Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
