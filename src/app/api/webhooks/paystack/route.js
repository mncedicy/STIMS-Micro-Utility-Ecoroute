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
    handleInvoiceUpdate
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

    // UNIVERSALLY SIGNED TO ECOROUTE APPS
    const AppId = 'ecoroute';
    const email = eventData.customer?.email || eventData.subscription?.customer?.email;

    // IDENTITY ENGINE MATRIX
    let userId = eventData.metadata?.user_id || eventData.subscription?.customer?.metadata?.user_id;

    if (!userId && email) {
        const { data: matchedRowByCode } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('user_email', email)
            .eq('app_id', AppId)
            .maybeSingle();
        if (matchedRowByCode) userId = matchedRowByCode.user_id;
    }

    if (!userId && eventData.customer?.customer_code) {
        const { data: matchedRowByCode } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', eventData.customer?.customer_code)
            .eq('app_id', AppId)
            .maybeSingle();
        if (matchedRowByCode) userId = matchedRowByCode.user_id;
    }

    if (!userId) {
        console.error(`🚨 Paystack Webhook Error: Could not resolve target user identification context for EcoRoute.`);
        return NextResponse.json({ received: false, error: "Identity unresolvable" }, { status: 200 });
    }

    // FIXED TOKEN EXTRACTOR: Looks inside child objects for valid token keys variations natively
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
        paystack_pay_token: resolvedEmailToken, // Injected token accurately here into ledger
        amount_cents: eventData.amount || eventData.subscription?.amount || 0,
        currency: eventData.currency || 'ZAR',
        payment_channel: eventData.channel || null,
        gateway_status: eventData.status || 'processed',
        raw_payload: payload
    };

    // LEDGER AUDITING
    const { error: ledgerError } = await supabaseAdmin
        .from('billing_transactions_ledger')
        .insert(json);

    if (ledgerError) console.error(`🚨 History Ledger Audit Failure: ${ledgerError.message} ${JSON.stringify(json)}`);

    // ROUTER ROUTINES SWITCH
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
