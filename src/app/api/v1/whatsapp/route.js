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
 * 1. META WEBHOOK HANDSHAKE VERIFICATION (GET)
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ecoroute_secret_handshake';

        if (mode === 'subscribe' && token === localVerifyToken) {
            console.log('📌 Meta WhatsApp Webhook Handshake verified successfully.');
            return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }

        return NextResponse.json({ error: 'Forbidden handshake signature matching failure.' }, { status: 403 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * 2. LIVE INBOUND WHATSAPP MESSAGE HANDLER (POST)
 */
export async function POST(req) {
    try {
        // Extract raw string text stream immediately to prevent payload mutation errors
        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        // SECURE GATEKEEPER CHECK: Validates incoming request source authenticity
        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            console.error('🚫 [Security Block]: Webhook block triggered. Request failed signature validation matching.');
            return NextResponse.json({ error: 'Unauthorized payload origin signature mismatched.' }, { status: 401 });
        }

        // Safely parse JSON structure once origin source is authenticated
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

        // A. Authenticate user profile using active phone mapping index lookup
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, company')
            .eq('phone_number', cleanPhoneNumber)
            .maybeSingle();

        if (profileError || !userProfile) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Your mobile number is not registered. Please link this number in your Web Dashboard account settings.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Fetch corporate API metadata token limits for quota tracking checks
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

        // B. Offload calculation string parsing out to the modular parser script
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
