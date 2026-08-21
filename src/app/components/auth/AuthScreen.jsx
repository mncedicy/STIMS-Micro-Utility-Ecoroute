// src\app\components\auth\AuthScreen.jsx

'use client';

import React, { useState, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../../lib/supabaseClient';

import AuthMessage from './AuthMessage';
import SignupFields from './SignupFields';
import ForgotPasswordForm from './ForgotPasswordForm';
import SocialAuth from './SocialAuth';

export default function AuthScreen() {
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'

    // Auth Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Additional Profile Fields (Sign-Up)
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');
    const [countryCode, setCountryCode] = useState('');

    // UI Toggles & States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', success: false });

    // Turnstile State
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    const switchMode = (newMode) => {
        setMode(newMode);
        setMessage({ text: '', success: false });
        setPassword('');
        setConfirmPassword('');
        resetCaptcha();
    };

    const resetCaptcha = () => {
        setCaptchaToken('');
        turnstileRef.current?.reset();
    };

    // Inside AuthScreen.jsx

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

            } else if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setMessage({ text: 'Passwords do not match.', success: false });
                    setLoading(false);
                    return;
                }

                // --- REPLACE YOUR SIGNUP LOGIC HERE ---
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        captchaToken,
                        data: {
                            first_name: firstName.trim(),
                            surname: surname.trim(),
                            company: company.trim(),
                            country_code: countryCode.trim().toUpperCase(),
                        },
                    },
                });

                if (error) throw error;

                // Check if the user already exists (identities array will be empty)
                if (data?.user && data?.user?.identities?.length === 0) {
                    setMessage({
                        text: 'This email is already registered. Please sign in instead.',
                        success: false
                    });
                    resetCaptcha(); // Reset captcha so user can retry or log in
                    setLoading(false);
                    return;
                }

                setMessage({ text: 'Account created! Check your email for verification.', success: true });
                // --- END OF UPDATED SIGNUP LOGIC ---

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
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err) {
            setMessage({ text: err.message || 'Google Sign-In failed.', success: false });
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
            {mode === 'forgot' ? (
                <ForgotPasswordForm
                    email={email}
                    setEmail={setEmail}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    message={message}
                    turnstileRef={turnstileRef}
                    turnstileSiteKey={turnstileSiteKey}
                    setCaptchaToken={setCaptchaToken}
                    captchaToken={captchaToken}
                    switchMode={switchMode}
                />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' ? (
                        <SignupFields
                            email={email}
                            setEmail={setEmail}
                            firstName={firstName}
                            setFirstName={setFirstName}
                            surname={surname}
                            setSurname={setSurname}
                            company={company}
                            setCompany={setCompany}
                            countryCode={countryCode}
                            setCountryCode={setCountryCode}
                            password={password}
                            setPassword={setPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            showConfirmPassword={showConfirmPassword}
                            setShowConfirmPassword={setShowConfirmPassword}
                            loading={loading}
                        />
                    ) : (
                        <>
                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@domain.com"
                                    required
                                    disabled={loading}
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        Password *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('forgot')}
                                        disabled={loading}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wide cursor-pointer disabled:opacity-50"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="my-2 flex justify-center">
                        <Turnstile
                            ref={turnstileRef}
                            siteKey={turnstileSiteKey}
                            onSuccess={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken('')}
                            options={{ theme: 'dark', size: 'normal' }}
                        />
                    </div>

                    <AuthMessage message={message} />

                    <button
                        type="submit"
                        disabled={loading || !captchaToken}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                    >
                        {loading
                            ? 'Processing...'
                            : mode === 'login'
                                ? 'Authorize Session ➔'
                                : 'Create Account ➔'}
                    </button>

                    <SocialAuth handleGoogleSignIn={handleGoogleSignIn} loading={loading} />

                    <div className="pt-4 text-center border-t border-slate-800/60 mt-4 text-slate-400 text-[11px] normal-case">
                        {mode === 'login' ? (
                            <p>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('signup')}
                                    className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1 uppercase text-[10px] tracking-wide cursor-pointer"
                                >
                                    Sign Up
                                </button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1 uppercase text-[10px] tracking-wide cursor-pointer"
                                >
                                    Sign In
                                </button>
                            </p>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}