// src/app/api/v1/webhook-receiver/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const eventHeader = req.headers.get('x-ecoroute-event') || 'UNKNOWN_EVENT';
        const userAgent = req.headers.get('user-agent') || 'UNKNOWN_AGENT';

        const payload = await req.json();

        // --- CONSOLE LOGGING FOR LOCAL TESTING ---
        console.log('\n========================================');
        console.log('🔔 [WEBHOOK RECEIVED & CONSOLED SUCCESSFULLY]');
        console.log('========================================');
        console.log(`⏱️ Timestamp Header / Time: ${new Date().toISOString()}`);
        console.log(`🏷️ Event Type (X-EcoRoute-Event): ${eventHeader}`);
        console.log(`🤖 Dispatched Via: ${userAgent}`);
        console.log('📦 Parsed JSON Payload Body:');
        console.dir(payload, { depth: null, colors: true });
        console.log('========================================\n');

        return NextResponse.json({
            received: true,
            status: 'SUCCESS',
            acknowledged_event: eventHeader,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (err) {
        console.error('🚨 [Webhook Receiver Error]: Failed to parse payload:', err.message);
        return NextResponse.json({ error: 'Invalid payload structure: ' + err.message }, { status: 400 });
    }
}
