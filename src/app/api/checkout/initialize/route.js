// src/app/api/checkout/initialize/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3001',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}


export async function POST(req) {
    try {
        const { userId, userEmail } = await req.json();

        if (!userId || !userEmail) {
            return NextResponse.json({ success: false, error: "Missing identity tokens." }, { status: 400 });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ success: false, error: "PAYSTACK_SECRET_KEY is missing from local .env.local file." }, { status: 500 });
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail.trim().toLowerCase(),
                amount: 28000, // R280 represented in cents
                currency: "ZAR",
                callback_url: `http://localhost:3001/?stims_app_id=ecoroute`,
                metadata: {
                    user_id: userId,
                    app_id: "ecoroute",
                    tier: "premium"
                }
            }),
            cache: 'no-store'
        });

        console.log(req.body, userId, userEmail);
        const result = await response.json();
        if (!result.status) throw new Error(result.message || "Paystack initialization rejected.");

        return NextResponse.json({ success: true, url: result.data.authorization_url });

    } catch (error) {
        console.error("🚨 EcoRoute Checkout Route Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
