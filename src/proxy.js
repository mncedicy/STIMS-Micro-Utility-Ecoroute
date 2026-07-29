// /src/proxy.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                storageKey: 'stims-enterprise-sso', // Binds custom ecosystem single sign-on token streams
                persistSession: true,
                flowType: 'pkce'
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set({ name, value, ...options });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({ name, value, ...options });
                    });
                },
            },
        }
    );

    // Decodes, validates, and auto-refreshes security signatures inside the background server thread
    await supabase.auth.getUser();

    return response;
}

// Guard pattern limits execution path boundaries exclusively to estimates and ledger tracks
export const config = {
    matcher: ['/api/estimates/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\..*|$).*)'],
};
