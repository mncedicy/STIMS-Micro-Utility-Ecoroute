// src/app/auth/callback/route.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${requestUrl.origin}/?error=no_code_provided`);
    }

    const cookieStore = await cookies();
    let response = NextResponse.redirect(`${requestUrl.origin}/?login=success`);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                            response.cookies.set(name, value, options);
                        });
                    } catch {
                        // Ignore if called during static generation
                    }
                },
            },
            cookieOptions: {
                name: 'stims-enterprise-sso',
            },
        }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('Supabase OAuth Exchange Failure:', error.message);
        await supabase.auth.signOut();
        return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(error.message)}`);
    }

    return response;
}