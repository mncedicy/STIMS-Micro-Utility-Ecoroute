// src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

/**
 * 1. META WEBHOOK HANDSHAKE VERIFICATION (GET)
 * Isolated from external sub-module imports to guarantee zero module-not-found errors during handshake verification.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        // Fallback checks matching your explicit portal settings layout rules
        const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ecoroute_secret_handshake';

        console.log(`[WhatsApp QA Handshake Check]: Mode: ${mode}, Token Recv: ${token}`);

        if (mode === 'subscribe' && token === localVerifyToken) {
            console.log('📌 Meta WhatsApp Webhook Handshake verified successfully.');
            // Mandated plain text echo return signature formatting block
            return new Response(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': String(challenge?.length || 0)
                }
            });
        }

        console.warn('❌ Handshake token tracking failed to match system rules.');
        return NextResponse.json({ error: 'Forbidden handshake matching validation error.' }, { status: 403 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * 2. LIVE INBOUND WHATSAPP MESSAGE HANDLER (POST)
 */
export async function POST(req) {
    try {
        // Dynamic lazy loading to trap module breaks inside the post loop execution layer safely
        const { handleIncomingCommand } = await import('./commandParser');
        const { verifyMetaWebhookSignature } = await import('./security');
        const { sendMetaWhatsappMessage } = await import('./metaClient');

        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            return NextResponse.json({ error: 'Unauthorized payload signature mismatched.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT' }, { status: 200 });
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
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Your mobile number is not registered.");
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
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "Sorry, your monthly limit cap is exhausted.");
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
        console.error('🚨 WhatsApp Route processing error:', err.message);
        return NextResponse.json({ error: 'Internal channel pipeline disruption: ' + err.message }, { status: 500 });
    }
}
