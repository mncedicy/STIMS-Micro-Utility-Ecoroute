import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
    // Create our internal system role admin bypass client to read subscriptions safely
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "Missing identity reference." }, { status: 400 });
        }

        // 1. Locate the master subscription profile row for this user session inside public.user_subscriptions
        const { data: sub, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('app_id', 'ecoroute')
            .maybeSingle();

        if (subError) {
            return NextResponse.json({ error: `Database Ledger Query Error: ${subError.message}` }, { status: 500 });
        }


        // Initialize clean parameter allocation targets
        let paystackSubscriptionCode = (sub?.stripe_subscription_id || "").trim();
        let paystackEmailToken = (sub?.paystack_email_token || "").trim();

        // ========================================================================
        // WILDCARD LEDGER EXTRACTOR (BROAD TRACE BACKUP ENGINE)
        // ========================================================================
        // If parameters are missing from user_subscriptions, query ANY non-empty
        // transaction block inside the ledger table to extract tokens from raw logs.
        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.warn(`⚠️ Profile column empty for user ${userId}. Scanning whole history ledger for ANY valid contract references...`);

            const { data: ledgerEntries, error: ledgerTraceError } = await supabaseAdmin
                .from('billing_transactions_ledger')
                .select('paystack_subscription_code, raw_payload')
                .eq('user_id', userId)
                .eq('app_id', 'ecoroute')
                .not('raw_payload', 'is', null)
                .order('created_at', { ascending: false }); // Fetch newest transactions first

            if (!ledgerTraceError && ledgerEntries && ledgerEntries.length > 0) {
                // Loop through all saved ledger rows to extract the first available valid pair
                for (const entry of ledgerEntries) {
                    const codeCandidate = (entry.paystack_subscription_code || entry.raw_payload?.data?.subscription_code || "").trim();
                    const tokenCandidate = (entry.raw_payload?.data?.email_token || entry.raw_payload?.data?.customer?.metadata?.email_token || "").trim();

                    if (codeCandidate && codeCandidate.startsWith('SUB_')) {
                        paystackSubscriptionCode = codeCandidate;
                    }
                    if (tokenCandidate) {
                        paystackEmailToken = tokenCandidate;
                    }

                    // Break loop early as soon as we reconstruct a complete token pair
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
            return NextResponse.json({ error: "Server configuration parameter missing from environment workspace." }, { status: 500 });
        }

        // Hard validation: If still missing after scanning every single ledger row, block the request
        if (!paystackSubscriptionCode || !paystackEmailToken || paystackSubscriptionCode.startsWith('pending-')) {
            console.error(`❌ Cancellation Aborted: Final parameters are empty or unresolved. Code: "${paystackSubscriptionCode}", Token: "${paystackEmailToken}"`);
            return NextResponse.json({
                error: `Missing tracking keys. Checked user profile and history ledger rows, but no active 'SUB_' code was found. Please subscribe again to recreate valid keys.`
            }, { status: 400 });
        }

        console.log(`📡 Relaying cancellation intent payload processing directly to Paystack API gateway for Code: ${paystackSubscriptionCode}`);

        // DISPATCH SECURE COMMONLY USED JSON REJECTION PAYLOADS TO PAYSTACK
        const paystackResponse = await fetch('https://api.paystack.co/subscription/disable', {
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
            }, { status: 502 });
        }

        console.log(`[Paystack Gateway Forward Status Success]: Command processed. Awaiting background webhook trigger execution logic hooks.`);

        // Database row tracking state is purposely NOT modified here. 
        // We let your webhook router handle updates upon formal event response confirmation!
        return NextResponse.json({
            success: true,
            message: "Cancellation request acknowledged by Paystack. System account state properties will sync automatically upon webhook confirmation process."
        });

    } catch (error) {
        console.error("🚨 EcoRoute Cancellation Pipeline Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
