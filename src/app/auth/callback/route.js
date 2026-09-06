// src/app/auth/callback/route.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // Read cookies store safely on the server side
    const cookieStore = await cookies();

    // Read the referral email directly out of the shared browser cookie wrapper
    const cookieEmail = cookieStore.get('stims_referral_email')?.value;
    const referralEmail = cookieEmail ? decodeURIComponent(cookieEmail).trim() : null;

    if (!code) {
        return NextResponse.redirect(`${requestUrl.origin}/?error=no_code_provided`);
    }

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

    // Exchange code loop for an active session token
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('Supabase OAuth Exchange Failure:', error.message);
        await supabase.auth.signOut();
        return NextResponse.redirect(`${requestUrl.origin}/?error=auth_${encodeURIComponent(error.message)}`);
    }

    console.log('🔍 [DEBUG] Is user logged in?:', !!sessionData?.user);
    console.log('🔍 [DEBUG] Received user UUID:', sessionData?.user?.id || 'none');
    console.log('🔍 [DEBUG] Read referral email from Cookie:', referralEmail);

    if (sessionData?.user) {
        const userId = sessionData.user.id;

        // Check if the profile is brand new via your boolean column flag
        const { data: unprocessedProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .eq('referral_updated', false)
            .maybeSingle();

        const isBrandNewSignup = !!unprocessedProfile;
        console.log('🔍 [DEBUG] Is brand new account sign-up (referral_updated is false)?:', isBrandNewSignup);

        if (isBrandNewSignup) {
            // Call the database function to handle linking and profiles updating in one clean step
            const { error: rpcError } = await supabase.rpc('execute_referral_linking', {
                p_referred_user_id: userId,
                p_referral_email: referralEmail || ''
            });

            if (rpcError) {
                console.error('❌ [DEBUG] Referral processing function failed:', rpcError.message);
            } else {
                console.log('✅ [DEBUG] Referral records processed and profile flag locked successfully!');
            }
        } else {
            console.log('⚠️ [DEBUG] Old user logging back in. Skipping referral loops.');
        }

        // Always delete the tracking cookies on login to clean browser storage
        cookieStore.delete('stims_referral_email');
        response.cookies.delete('stims_referral_email');
    }

    return response;
}
