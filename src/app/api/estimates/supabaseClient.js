// /src/app/api/estimates/supabaseClient.js
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function getEstimatesSupabaseClient(tokenOverride = '') {
    // CRITICAL NEXT.JS 15 FIX: Await the asynchronous cookies Promise structure natively
    const cookieStore = await cookies();
    const headersList = await headers();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Detect if current session is running on localhost or a local staging host
    const host = headersList.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    // Helper matching your exact getCookieOptions architecture
    const getCookieOptionsServer = () => {
        if (isLocalhost) {
            return {
                path: '/',
                sameSite: 'lax',
                secure: false,
                maxAge: 60 * 60 * 24 * 7 // 1 Week
            };
        }
        return {
            domain: '.stims.co.za',
            path: '/',
            sameSite: 'lax',
            secure: true,
            maxAge: 60 * 60 * 24 * 7 // 1 Week
        };
    };

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                storageKey: 'stims-enterprise-sso', // Must match EXACTLY across all ecosystem platforms
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // Override default choices with your exact enterprise cookie rules parameters
                            const customServerOptions = {
                                ...options,
                                ...getCookieOptionsServer()
                            };
                            cookieStore.set(name, value, customServerOptions);
                        });
                    } catch {
                        /* Safe to ignore in Server Component routing pipelines */
                    }
                },
            },
        }
    );

    // HYDRATE TOKEN OVERRIDE CONTEXT: Inject fallback signature path if cookie layers are blocked
    const activeToken = tokenOverride || (headersList.get('authorization') || '').startsWith('Bearer ')
        ? (headersList.get('authorization') || '').substring(7).trim()
        : '';

    if (activeToken) {
        try {
            // Direct session injection: forces the Supabase engine to authorize via the Bearer token string
            await supabase.auth.setSession({
                access_token: activeToken,
                refresh_token: ''
            });
        } catch (err) {
            console.error('[Supabase Server Client Token Hydration Fault]:', err.message);
        }
    }

    return supabase;
}
