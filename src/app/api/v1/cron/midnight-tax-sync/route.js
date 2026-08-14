// src/app/api/v1/cron/midnight-tax-sync/route.js

import { createClient } from '@supabase/supabase-js';
import { dispatchCorporateWebhook } from '../../config/webhookDispatcher';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    // Basic verification layer to ensure call matching secret environment keys string
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_SECURITY_KEY}`) {
        return Response.json({ error: "Unauthorized cron execution attempt." }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        // Fetch all active tokens tracking liability states across profiles
        const { data: tokens } = await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .select('user_id, total_accrued_tax_liability_zar')
            .eq('is_active', true);

        if (tokens) {
            for (const token of tokens) {
                // Dispatch real-time mid-night ZAR balance status pushes to each active user profile
                await dispatchCorporateWebhook(token.user_id, 'tax_liability_updated', {
                    calculation_period_close: new Date().toISOString().split('T')[0],
                    accrued_tax_liability_zar: parseFloat(token.total_accrued_tax_liability_zar || 0)
                });
            }
        }

        return Response.json({ success: true, processed_profiles: tokens?.length || 0 });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
