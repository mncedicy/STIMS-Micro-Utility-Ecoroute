// File Location: src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 1. META WEBHOOK HANDSHAKE VERIFICATION (GET)
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const envToken = (process.env.WHATSAPP_VERIFY_TOKEN || '').trim();
        const fallbackToken = 'ecoroute_secret_handshake';

        console.log(`[WhatsApp Handshake]: Mode=${mode} | Token Received=${token} | Env Token=${envToken}`);

        const isTokenValid = (token === fallbackToken) || (envToken && token === envToken);

        if (mode === 'subscribe' && isTokenValid) {
            console.log('📌 Meta WhatsApp Webhook Handshake verified successfully.');

            return new Response(String(challenge), {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            });
        }

        console.warn(`❌ Handshake Token Mismatch. Expected '${envToken || fallbackToken}', got '${token}'`);
        return new Response('Forbidden', { status: 403 });
    } catch (err) {
        console.error('🚨 Handshake error:', err.message);
        return new Response(err.message, { status: 500 });
    }
}

/**
 * 2. LIVE INBOUND WHATSAPP MESSAGE HANDLER (POST)
 */
export async function POST(req) {
    try {
        const { handleIncomingCommand } = await import('./commandParser');
        const { verifyMetaWebhookSignature } = await import('./security');
        const { sendMetaWhatsappMessage } = await import('./metaClient');

        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            console.error('🚫 [Security Block]: Request failed signature validation matching.');
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

        // Phone variations matching (e.g. Meta sends 27784884519; database might store +27784884519 or 0784884519)
        const rawPhone = cleanPhoneNumber;
        const plusPhone = `+${rawPhone}`;
        const localPhone = rawPhone.startsWith('27') ? `0${rawPhone.slice(2)}` : rawPhone;

        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, company')
            .or(`phone_number.eq.${rawPhone},phone_number.eq.${plusPhone},phone_number.eq.${localPhone}`)
            .maybeSingle();

        if (profileError || !userProfile) {
            console.warn(`⚠️ User profile not found for phone number: ${cleanPhoneNumber}`);
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Your mobile number is not registered. Please link this number in your settings.");
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
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `Sorry, your corporate request quota has been exhausted.`);
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