// src/app/api/estimates/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const payload = await req.json();

        const targetUrl = process.env.NEXT_PUBLIC_CARBON_INTERFACE_URL || 'http://stims.co.za';
        const apiKey = process.env.CARBON_INTERFACE_KEY || 'xq50V27sfV9wbySH6OQdQ';

        // Execute background server-to-server connection request
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            return NextResponse.json({ error: result.error || `API returned status code ${response.status}` }, { status: response.status });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("🚨 EcoRoute Proxy Estimate Route Crash:", error.message);
        return NextResponse.json({ error: "Internal estimation server communication failure." }, { status: 500 });
    }
}
