// src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const envToken = (process.env.WHATSAPP_VERIFY_TOKEN || '').trim();

        if (!envToken) {
            console.error('🚨 [WhatsApp Webhook Setup Fault]: WHATSAPP_VERIFY_TOKEN is completely unassigned in server variables.');
            return new Response('Internal Configuration Error', { status: 500 });
        }

        if (mode === 'subscribe' && token === envToken) {
            return new Response(String(challenge), {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            });
        }

        return new Response('Forbidden Verification Token Mismatch', { status: 403 });
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { handleIncomingCommand } = await import('./commandParser');
        const { verifyMetaWebhookSignature } = await import('./security');
        const { sendMetaWhatsappMessage } = await import('./metaClient');

        const hostHeader = req.headers.get('host') || 'ecoroute.stims.co.za';
        const protocol = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1') ? 'http' : 'https';
        const incomingServerUrl = `${protocol}://${hostHeader}`;

        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            return NextResponse.json({ error: 'Unauthorized signature.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT' }, { status: 200 });
        }

        const valueBlock = body.entry[0].changes[0].value;
        const messageNode = valueBlock.messages[0];
        const metadataNode = valueBlock.metadata || {};

        const cleanPhoneNumber = String(messageNode.from || '').trim();
        const businessPhoneNumberId = metadataNode.phone_number_id || "1307900412406936";

        // FIXED: Re-mapped the input parser variable to support native Meta touch-button component replies
        let incomingMessage = '';
        const messageType = messageNode.type;

        if (messageType === 'text') {
            incomingMessage = (messageNode.text?.body || '').trim().toLowerCase();
        } else if (messageType === 'interactive') {
            const interactiveType = messageNode.interactive?.type;
            if (interactiveType === 'button_reply') {
                // Captures unique button element ID (e.g. 'menu_option_1')
                incomingMessage = String(messageNode.interactive?.button_reply?.id || '').trim().toLowerCase();
            } else if (interactiveType === 'list_reply') {
                // Captures unique list selection row item ID (e.g. 'menu_option_2')
                incomingMessage = String(messageNode.interactive?.list_reply?.id || '').trim().toLowerCase();
            }
        } else {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Plain text or interactive component button selections only.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const numericOnly = cleanPhoneNumber.replace(/\D/g, '');
        const lastDigits = numericOnly.length >= 9 ? numericOnly.slice(-9) : numericOnly;

        const { data: userProfiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, surname, company, email, phone_number')
            .ilike('phone_number', `%${lastDigits}%`);

        if (profileError) console.error('🚨 Supabase DB Query Error:', profileError.message);

        const userProfile = userProfiles?.[0];

        if (!userProfile) {
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
            supabaseAdmin,
            incomingServerUrl
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error('🚨 Webhook Pipeline Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}
