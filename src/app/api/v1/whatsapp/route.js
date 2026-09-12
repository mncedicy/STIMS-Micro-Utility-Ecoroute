// src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleIncomingCommand } from './commandParser';
import { sendMetaWhatsappMessage } from './metaClient';
import { verifyMetaWebhookSignature } from './security';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

/**
 * 1. FIXED META WEBHOOK HANDSHAKE VERIFICATION (GET)
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ecoroute_secure_handshake';

        console.log(`[WhatsApp Handshake Diagnostic]: Mode: ${mode}, Token Received: ${token}`);

        if (mode === 'subscribe' && token === localVerifyToken) {
            console.log('📌 Meta WhatsApp Webhook Handshake verified successfully.');
            // Enforces strict plain text return format demanded by Meta servers
            return new Response(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': String(challenge?.length || 0)
                }
            });
        }

        console.warn('❌ Handshake verification token failed to match local rule.');
        return NextResponse.json({ error: 'Forbidden handshake signature matching failure.' }, { status: 403 });
    } catch (err) {
        console.error('🚨 Handshake internal error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * 2. LIVE INBOUND WHATSAPP MESSAGE HANDLER (POST)
 */
export async function POST(req) {
    try {
        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            console.error('🚫 [Security Block]: Webhook block triggered. Request failed signature validation matching.');
            return NextResponse.json({ error: 'Unauthorized payload origin signature mismatched.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT_MUTATION' }, { status: 200 });
        }

        const valueBlock = body.entry[0].changes[0].value;
        const messageNode = valueBlock.messages[0];
        const metadataNode = valueBlock.metadata || {};

        const cleanPhoneNumber = messageNode.from;
        const businessPhoneNumberId = metadataNode.phone_number_id;

        if (messageNode.type !== 'text') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: System accepts plain text parameters only.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const incomingMessage = (messageNode.text?.body || '').trim().toLowerCase();

        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, company')
            .eq('phone_number', cleanPhoneNumber)
            .maybeSingle();

        if (profileError || !userProfile) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Your mobile number is not registered. Please link this number in your Web Dashboard account settings.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const { data: tokenRecord } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('*')
            .eq('user_id', userProfile.id)
            .maybeSingle();

        const currentUsage = tokenRecord?.current_monthly_usage || 0;
        const usageCap = tokenRecord?.usage_limit_cap || 100;

        if (currentUsage >= usageCap) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `Sorry ${userProfile.first_name || 'User'}, your corporate monthly request quota has been fully exhausted.`);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        await handleIncomingCommand({
            incomingMessage,
            userProfile,
            tokenRecord,
            currentUsage,
            usageCap,
            businessPhoneNumberId,
            cleanPhoneNumber,
            supabaseAdmin
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error('🚨 WhatsApp Meta Gateway Crash Exception:', err.message);
        return NextResponse.json({ error: 'Internal channel pipeline disruption: ' + err.message }, { status: 500 });
    }
}
