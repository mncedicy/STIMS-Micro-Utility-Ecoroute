import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCertificateHtml } from '../../../lib/certificateTemplate'; // Import the template

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
        // 1. Fetch specific compliance log record from Supabase
        const { data: log, error } = await supabase
            .from('emissions_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !log) {
            return new NextResponse(
                `<html><body style="font-family:sans-serif; background:#020617; color:#f8fafc; padding:40px; text-align:center;">
                    <h2>Compliance Record Not Found</h2>
                    <p style="color:#94a3b8">The log ID requested does not match any authenticated system entries.</p>
                 </body></html>`,
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            );
        }

        // 2. Generate the visual layout html string using the template utility
        const htmlContent = generateCertificateHtml(log);

        // 3. Return streaming HTML document directly back to the active browser view
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
