// src/app/api/checkout/cancel/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    // Create our internal system role admin bypass client to read subscriptions safely
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { userId } = await req.json();
        if (!userId) return NextResponse.json({ error: "Missing identity reference." }, { status: 400 });

        // 1. Locate the active subscription row for this user session inside public.user_subscriptions
        const { data: sub, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('app_id', 'ecoroute')
            .maybeSingle();

        if (subError || !sub) {
            return NextResponse.json({ error: "No active premium accounts found matching database logs." }, { status: 404 });
        }

        // 2. STIMS SUBSCRIPTION MANAGEMENT ARCHITECTURE LINK
        // We update our master cloud ledger immediately to register the cancellation state shift
        const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
                tier: 'free',
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', sub.id);

        if (updateError) throw updateError;

        // 3. OPTIONAL: If using Paystack Subscription Plans natively, you can invoke their subscription disable route here:
        /*
        if (sub.paystack_subscription_code) {
           await fetch(`https://paystack.co`, {
             method: 'POST',
             headers: {
               'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY.trim()}`,
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({ code: sub.paystack_subscription_code, token: sub.paystack_email_token })
           });
        }
        */

        return NextResponse.json({ success: true, message: "Subscription cancelled successfully." });

    } catch (error) {
        console.error("🚨 EcoRoute Cancellation Pipeline Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
