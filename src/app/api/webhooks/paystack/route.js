// src/app/api/webhooks/paystack/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
    handleChargeSuccess,
    handleSubscriptionCreate,
    handleSubscriptionNotRenew,
    handleSubscriptionDisable,
    handlePaymentFailure,
    handleInvoiceUpdate,
    handleTransferSuccess,
    handleTransferFailure
} from './handlers';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    let rawBody;
    let paystackSignature;

    try {
        rawBody = await req.text();
        paystackSignature = req.headers.get('x-paystack-signature');
    } catch (err) {
        return NextResponse.json({ error: "Invalid request payload attributes." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        console.error("🚨 STIMS Billing: PAYSTACK_SECRET_KEY missing from environment configurations.");
        return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    const computedHash = crypto.createHmac('sha512', secretKey.trim()).update(rawBody).digest('hex');
    if (computedHash !== paystackSignature) {
        console.error("🚨 STIMS Billing: Paystack verification signature mismatch.");
        return NextResponse.json({ error: "Unauthorized transaction source signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log("📦 COMPLETE PAYSTACK PAYLOAD:", JSON.stringify(payload, null, 2));

    const event = payload.event;
    const eventData = payload.data;

    // INTERCEPT ASYNCHRONOUS DECOUPLED TRANSFER BALANCES ACTIONS FIRST:
    if (event === 'transfer.success') {
        try {
            await handleTransferSuccess(supabaseAdmin, eventData);
            return NextResponse.json({ received: true }, { status: 200 });
        } catch (err) {
            console.error('🚨 Webhook Transfer Success Execution Error:', err.message);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }

    if (event === 'transfer.failed' || event === 'transfer.reversed') {
        try {
            await handleTransferFailure(supabaseAdmin, eventData);
            return NextResponse.json({ received: true }, { status: 200 });
        } catch (err) {
            console.error('🚨 Webhook Transfer Failure Execution Error:', err.message);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }

    const AppId = 'ecoroute';
    const email = eventData.customer?.email || eventData.subscription?.customer?.email;

    // 1. IDENTITY ENGINE MATRIX: Try metadata first
    let userId = eventData.metadata?.user_id ||
        eventData.subscription?.customer?.metadata?.user_id ||
        eventData.metadata?.custom_fields?.find(f => f.variable_name === 'user_id')?.value;

    // 2. Try matching existing subscription rows by email or customer code
    if (!userId && email) {
        const { data: matchedRowByEmail } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('user_email', email)
            .eq('app_id', AppId)
            .maybeSingle();
        if (matchedRowByEmail) userId = matchedRowByEmail.user_id;
    }

    if (!userId && eventData.customer?.customer_code) {
        const { data: matchedRowByCode } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', eventData.customer?.customer_code)
            .eq('app_id', AppId)
            .maybeSingle();
        if (matchedRowByCode) userId = matchedRowByCode.customer_code;
    }

    // 3. PRODUCTION FALLBACK FOR NEW USERS: Query Supabase Auth Schema directly via email match
    if (!userId && email) {
        const { data: authUserData } = await supabaseAdmin
            .rpc('get_user_id_by_email', { target_email: email })
            .maybeSingle();

        if (!authUserData) {
            const { data: profileMatch } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            if (profileMatch) userId = profileMatch.id;
        } else {
            userId = authUserData.id;
        }
    }

    if (!userId) {
        console.error(`🚨 Paystack Webhook Fatal Warning: Could not resolve target user identification context for email: ${email}. Storing payload to ledger for manual audit review.`);

        await supabaseAdmin.from('billing_transactions_ledger').insert({
            app_id: AppId,
            event_type: event,
            paystack_reference: eventData.reference || null,
            gateway_status: 'orphan_unresolved_user',
            raw_payload: payload
        });

        return NextResponse.json({ received: true, warning: "Identity unresolvable, logged to orphan ledger" }, { status: 200 });
    }

    const resolvedSubscriptionCode = eventData.subscription_code || eventData.subscription?.subscription_code || null;
    const resolvedEmailToken = eventData.email_token ||
        eventData.authorization?.email_token ||
        eventData.subscription?.email_token ||
        eventData.plan?.email_token ||
        null;

    const json = {
        user_id: userId,
        app_id: AppId,
        event_type: event,
        paystack_reference: eventData.reference || null,
        paystack_subscription_code: resolvedSubscriptionCode,
        paystack_pay_token: resolvedEmailToken,
        amount_cents: eventData.amount || eventData.subscription?.amount || 0,
        currency: eventData.currency || 'ZAR',
        payment_channel: eventData.channel || null,
        gateway_status: eventData.status || 'processed',
        raw_payload: payload
    };

    const { error: ledgerError } = await supabaseAdmin
        .from('billing_transactions_ledger')
        .insert(json);

    if (ledgerError) console.error(`🚨 History Ledger Audit Failure: ${ledgerError.message}`);

    try {
        switch (event) {
            case 'charge.success':
                await handleChargeSuccess(supabaseAdmin, eventData, userId, AppId);
                break;

            case 'subscription.create':
                await handleSubscriptionCreate(supabaseAdmin, eventData, userId, AppId);
                break;

            case 'subscription.not_renew':
                await handleSubscriptionNotRenew(supabaseAdmin, eventData, userId, AppId);
                break;

            case 'subscription.disable':
                await handleSubscriptionDisable(supabaseAdmin, eventData, userId, AppId);
                break;

            case 'invoice.update':
                await handleInvoiceUpdate(supabaseAdmin, eventData, userId, AppId);
                break;

            case 'invoice.payment_failed':
            case 'subscription.not_renewed':
                await handlePaymentFailure(supabaseAdmin, eventData, event, userId, AppId);
                break;

            default:
                console.log(`⚠️ Unhandled Paystack Event Type Encountered: ${event}`);
                break;
        }
    } catch (handlerError) {
        console.error(`🚨 Webhook Execution Error [${event}]:`, handlerError.message);
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
