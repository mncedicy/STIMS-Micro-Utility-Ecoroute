// src/app/api/checkout/cancel/route.js

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

        // FIXED RECONCILIATION: Extract either camelCase or snake_case request layouts safely
        const userId = body.userId || body.user_id;

        if (!userId) {
            console.error("🚨 Cancellation Endpoint Rejection: Received an unresolvable or empty target userId identifier body context payload.", JSON.stringify(body));
            return NextResponse.json({ error: "Missing identity reference parameters." }, { status: 400, headers: corsHeaders });
        }

        // 1. Locate the master subscription profile row for this user session inside public.user_subscriptions
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

        // ========================================================================
        // WILDCARD LEDGER EXTRACTOR (BROAD TRACE BACKUP ENGINE)
        // ========================================================================
        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.warn(`⚠️ Profile column empty for user ${userId}. Scanning whole history ledger for valid EcoRoute contract references...`);

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

        // 2. PAYSTACK GATEWAY INTEGRATION SECURITY LAYER
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            console.error("🚨 STIMS Billing: PAYSTACK_SECRET_KEY is missing from environment variables.");
            return NextResponse.json({ error: "Server configuration parameter missing from environment workspace." }, { status: 500, headers: corsHeaders });
        }

        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.error(`❌ Cancellation Aborted: Final parameters are empty or unresolved for EcoRoute. Code: "${paystackSubscriptionCode}", Token: "${paystackEmailToken}"`);
            return NextResponse.json({
                error: `Missing tracking keys. Checked user profile and history ledger rows, but no active 'SUB_' code was found. Please subscribe again to recreate valid keys.`
            }, { status: 400, headers: corsHeaders });
        }

        console.log(`📡 Relaying cancellation intent payload processing directly to Paystack API gateway for Code: ${paystackSubscriptionCode}`);

        const paystackResponse = await fetch(process.env.PAYSTACK_CANCEL_URL || "https://paystack.co", {
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
