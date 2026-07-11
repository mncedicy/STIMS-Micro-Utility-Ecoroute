// src/app/api/pdf/[id]/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCertificateHtml } from '../../../lib/certificateTemplate';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Fetch compliance log record from our updated ecoroute_emissions_logs table
        const { data: log, error } = await supabaseAdmin
            .from('ecoroute_emissions_logs')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !log) {
            return new NextResponse(
                `<html><body style="font-family:sans-serif; background:#020617; color:#f8fafc; padding:40px; text-align:center;">
                    <h2>Compliance Record Not Found</h2>
                    <p style="color:#94a3b8">The log ID requested does not match any authenticated system entries.</p>
                 </body></html>`,
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            );
        }

        const htmlContent = generateCertificateHtml(log);

        return new NextResponse(htmlContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error) {
        console.error("⛔ PRINT ENGINE FAIL EVENT:", error.message);
        return NextResponse.json({ error: "Internal compliance system failure event." }, { status: 500 });
    }
}
