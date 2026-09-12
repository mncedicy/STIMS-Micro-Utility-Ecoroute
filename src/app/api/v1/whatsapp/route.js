// File Location: src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdminServer';

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

        const fallbackToken = 'ecoroute_secret_handshake';
        const envToken = (process.env.WHATSAPP_VERIFY_TOKEN || '').trim();

        const isTokenValid = (token === fallbackToken) || (envToken && token === envToken);

        if (mode === 'subscribe' && isTokenValid) {
            return new Response(String(challenge), {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            });
        }

        return new Response('Forbidden', { status: 403 });
    } catch (err) {
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
            return NextResponse.json({ error: 'Unauthorized signature.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT' }, { status: 200 });
        }

        const valueBlock = body.entry[0].changes[0].value;
        const messageNode = valueBlock.messages[0];
        const metadataNode = valueBlock.metadata || {};

        const cleanPhoneNumber = String(messageNode.from || '').trim(); // e.g. "27784884519"
        const businessPhoneNumberId = metadataNode.phone_number_id || "1307900412406936";

        if (messageNode.type !== 'text') {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, "EcoRoute Guard: Plain text commands only.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const incomingMessage = (messageNode.text?.body || '').trim().toLowerCase();

        // Variations setup
        const rawPhone = cleanPhoneNumber;
        const plusPhone = `+${rawPhone}`;
        const localPhone = rawPhone.startsWith('27') ? `0${rawPhone.slice(2)}` : rawPhone;

        const targetNumbers = [rawPhone, plusPhone, localPhone];
        console.log('🔍 [Database Query Target Numbers]:', targetNumbers);

        // 1. Primary Array Match Query
        let { data: userProfiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, company, phone_number')
            .in('phone_number', targetNumbers);

        // 2. Fallback Substring / ILIKE Match Query (if exact match yields empty array)
        if (!userProfiles || userProfiles.length === 0) {
            console.warn('⚠️ Standard .in() check failed. Attempting ILIKE fallback search...');
            const { data: fallbackProfiles, error: fallbackError } = await supabaseAdmin
                .from('profiles')
                .select('id, first_name, company, phone_number')
                .ilike('phone_number', `%${localPhone.slice(-9)}%`);

            userProfiles = fallbackProfiles;
            profileError = fallbackError;
        }

        const userProfile = userProfiles?.[0];

        if (profileError || !userProfile) {
            console.error(`❌ Profile Lookup Failed. DB Error:`, profileError);
            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                "EcoRoute Guard: Your mobile number is not registered. Please link this number in your settings."
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        console.log(`✅ [Profile Matched]: ${userProfile.first_name || 'User'} (${userProfile.id})`);

        // Fetch User Token Quota
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
        console.error('🚨 Webhook Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}