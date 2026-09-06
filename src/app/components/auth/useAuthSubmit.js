// src/app/components/auth/useAuthSubmit.js
'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useAuthSubmit({
    email,
    password,
    confirmPassword,
    firstName,
    surname,
    company,
    countryCode,
    captchaToken,
    resetCaptcha,
    switchMode,
    mode
}) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', success: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', success: false });

        if (!captchaToken) {
            setMessage({ text: 'Please complete the CAPTCHA verification.', success: false });
            return;
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options: { captchaToken },
                });
                if (error) throw error;
                setMessage({ text: 'Session authorized successfully!', success: true });
                window.location.reload();

            } else if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setMessage({ text: 'Passwords do not match.', success: false });
                    setLoading(false);
                    return;
                }

                let savedReferralEmail = null;
                if (typeof window !== 'undefined') {
                    savedReferralEmail = localStorage.getItem('stims_referral_email');
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        captchaToken,
                        data: {
                            first_name: firstName.trim(),
                            surname: surname.trim(),
                            company: company.trim(),
                            country_code: countryCode.trim().toUpperCase()
                        },
                    },
                });

                if (error) throw error;

                if (data?.user && data?.user?.identities?.length === 0) {
                    setMessage({
                        text: 'This email is already registered. Please sign in instead.',
                        success: false
                    });
                    resetCaptcha();
                    setLoading(false);
                    return;
                }

                if (data?.user) {
                    await supabase.rpc('execute_referral_linking', {
                        p_referred_user_id: data.user.id,
                        p_referral_email: savedReferralEmail ? savedReferralEmail.trim() : ''
                    });
                }

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('stims_referral_email');
                    document.cookie = 'stims_referral_email=; path=/; max-age=0; SameSite=Lax; Secure';
                }

                if (data?.session) {
                    setMessage({ text: 'Account created successfully! Logging you in...', success: true });
                    window.location.reload();
                    return;
                }

                setMessage({ text: 'Account created! Please check your email inbox to verify your account and activate your portal.', success: true });

                setTimeout(() => {
                    switchMode('login');
                }, 3000);

            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, { captchaToken });
                if (error) throw error;
                setMessage({ text: 'Password reset instructions sent to your email.', success: true });
            }
        } catch (err) {
            setMessage({ text: err.message || 'An unexpected error occurred.', success: false });
            resetCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage({ text: '', success: false });

        try {
            let savedReferralEmail = null;
            if (typeof window !== 'undefined') {
                savedReferralEmail = localStorage.getItem('stims_referral_email');
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: savedReferralEmail ? {
                        referral_email: savedReferralEmail.trim(),
                        prompt: 'select_account consent'
                    } : {
                        prompt: 'select_account'
                    }
                },
            });
            if (error) throw error;
        } catch (err) {
            setMessage({ text: err.message || 'Google Sign-In failed.', success: false });
            setLoading(false);
        }
    };

    return { loading, message, handleSubmit, handleGoogleSignIn, setMessage };
}
