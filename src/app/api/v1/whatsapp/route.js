// File Location: src/app/api/v1/whatsapp/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

        // Fallback to strict string if env var isn't loaded on Vercel/server yet
        const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ecoroute_secret_handshake';

        console.log(`[WhatsApp Handshake]: mode=${mode}, token=${token}`);

        if (mode === 'subscribe' && token === localVerifyToken) {
            console.log('📌 Meta Handshake verified successfully.');

            // Meta expects ONLY the raw challenge string in plain text
            return new Response(String(challenge), {
                status: 200,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        console.warn('❌ Handshake verify token mismatch.');
        return new Response('Forbidden', { status: 403 });
    } catch (err) {
        console.error('🚨 Handshake error:', err.message);
        return new Response(err.message, { status: 500 });
    }
}