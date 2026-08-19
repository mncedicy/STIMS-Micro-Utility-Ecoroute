'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SignupFields from './auth/SignupFields';

// Constants for local attempt throttling
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60-second lockout

export default function AuthScreen({ onAuthSuccess, isVerifiedRedirect = false }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');

    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    // --- LOCAL ATTEMPT & LOCKOUT TRACKING ---
    const [attempts, setAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [remainingLockoutSec, setRemainingLockoutSec] = useState(0);

    const [message, setMessage] = useState(() => {
        if (isVerifiedRedirect) {
            return {
                success: true,
                text: 'Email verified successfully! Please enter your credentials to log in.',
            };
        }
        return { success: null, text: '' };
    });

    // 1. Hydrate lockout state from localStorage on mount
    useEffect(() => {
        const savedAttempts = parseInt(localStorage.getItem('auth_failed_attempts') || '0', 10);
        const savedLockout = localStorage.getItem('auth_lockout_until');

        setAttempts(savedAttempts);

        if (savedLockout) {
            const lockTime = parseInt(savedLockout, 10);
            if (lockTime > Date.now()) {
                setLockoutUntil(lockTime);
            } else {
                // Lockout expired
                localStorage.removeItem('auth_lockout_until');
            }
        }
    }, []);

    // 2. Countdown timer for lockout state
    useEffect(() => {
        if (!lockoutUntil) return;

        const interval = setInterval(() => {
            const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (diff <= 0) {
                setLockoutUntil(null);
                setAttempts(0);
                setRemainingLockoutSec(0);
                localStorage.removeItem('auth_failed_attempts');
                localStorage.removeItem('auth_lockout_until');
                clearInterval(interval);
            } else {
                setRemainingLockoutSec(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutUntil]);

    // Helper to trigger lockout
    const registerFailedAttempt = () => {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        localStorage.setItem('auth_failed_attempts', nextAttempts.toString());

        if (nextAttempts >= MAX_ATTEMPTS) {
            const until = Date.now() + LOCKOUT_DURATION_MS;
            setLockoutUntil(until);
            localStorage.setItem('auth_lockout_until', until.toString());
            setMessage({
                success: false,
                text: `Too many failed attempts. Login temporarily disabled for 60 seconds.`,
            });
        } else {
            setMessage({
                success: false,
                text: `Invalid credentials. ${MAX_ATTEMPTS - nextAttempts} attempt(s) remaining before temporary lockout.`,
            });
        }
    };

    const resetFailedAttempts = () => {
        setAttempts(0);
        setLockoutUntil(null);
        localStorage.removeItem('auth_failed_attempts');
        localStorage.removeItem('auth_lockout_until');
    };

    // Hydrate countries
    useEffect(() => {
        let isMounted = true;
        async function loadStaticCountriesRegistry() {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_countries')
                    .select('id, code, name, continent')
                    .order('name', { ascending: true });

                if (!error && data && isMounted) {
                    setCountryList(data);
                }
            } catch (err) {
                console.error('[Static Countries Hydration Fault]:', err);
            }
        }
        loadStaticCountriesRegistry();
        return () => {
            isMounted = false;
        };
    }, []);

    const switchMode = (newMode) => {
        setMode(newMode);
        setMessage({ success: null, text: '' });
        setShowPassword(false);
        setShowConfirmPassword(false);
        setPassword('');
        setConfirmPassword('');
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setMessage({ success: false, text: 'Please enter your email address.' });
            return;
        }

        setLoading(true);
        setMessage({ success: null, text: '' });

        try {
            const redirectUrl = `${window.location.origin}/update-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setMessage({
                success: true,
                text: 'Success! A password reset link has been dispatched to your email address.',
            });
        } catch (error) {
            setMessage({
                success: false,
                text: error.message || 'Failed to send recovery email.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAuthActionSubmit = async (e) => {
        e.preventDefault();

        // Block submission if currently locked out
        if (mode === 'login' && lockoutUntil && Date.now() < lockoutUntil) {
            setMessage({
                success: false,
                text: `Too many attempts. Please wait ${remainingLockoutSec} second(s) before trying again.`,
            });
            return;
        }

        setLoading(true);
        setMessage({ success: null, text: '' });

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        try {
            if (mode === 'login') {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword,
                });

                if (loginError) {
                    registerFailedAttempt();
                    if (loginError.message.includes('Email not confirmed')) {
                        throw new Error('Please confirm your email address before signing in.');
                    }
                    return; // Message handled inside registerFailedAttempt
                }

                // On successful authentication, reset local counters
                resetFailedAttempts();

                setMessage({
                    success: true,
                    text: 'Authorization cleared. Initializing dashboard...',
                });

                if (typeof onAuthSuccess === 'function') onAuthSuccess();
            } else if (mode === 'signup') {
                if (!firstName.trim()) throw new Error('First name is required.');
                if (!selectedCountry) throw new Error('Please select your country of operations.');
                if (password !== confirmPassword) throw new Error('Passwords do not match.');
                if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

                const resolvedCleanCode = selectedCountry.code.toString().trim().toUpperCase();

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        data: {
                            first_name: firstName.trim(),
                            surname: surname.trim(),
                            company: company.trim(),
                            country_code: resolvedCleanCode,
                        },
                    },
                });

                if (signUpError) throw signUpError;
                if (!signUpData?.user) throw new Error('Registration timed out.');

                await supabase.auth.signOut();

                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setMessage({
                    success: true,
                    text: `Account created! A confirmation email was sent to ${trimmedEmail}. Please verify your email before logging in.`,
                });
            }
        } catch (error) {
            setMessage({
                success: false,
                text: error.message || 'Authentication error occurred.',
            });
        } finally {
            setLoading(false);
        }
    };

    const isFormLocked = Boolean(lockoutUntil && Date.now() < lockoutUntil);

    return (
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-md shadow-2xl font-mono text-xs text-left relative z-10 max-w-md mx-auto">
            {/* Header */}
            <div className="mb-6 border-b border-slate-800/60 pb-4">
                <h2 className="text-xl font-bold text-white tracking-wide">
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Sign Up'}
                    {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-slate-400 text-[11px] mt-1 normal-case">
                    {mode === 'login' && 'Enter your credentials to access your account'}
                    {mode === 'signup' && 'Create a new corporate ledger profile'}
                    {mode === 'forgot' && 'Enter your account email to receive a recovery link'}
                </p>
            </div>

            {mode === 'forgot' ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@domain.co.za"
                            required
                            disabled={loading}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                        />
                    </div>

                    {message.text && <AuthMessage message={message} />}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Dispatching Link...' : 'Send Recovery Link ➔'}
                    </button>

                    <div className="pt-3 text-center border-t border-slate-800/60 mt-4">
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="text-slate-400 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                            ← Back to Sign In
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleAuthActionSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <SignupFields
                            loading={loading}
                            firstName={firstName}
                            setFirstName={setFirstName}
                            surname={surname}
                            setSurname={setSurname}
                            company={company}
                            setCompany={setCompany}
                            countryList={countryList}
                            selectedCountry={selectedCountry}
                            setSelectedCountry={setSelectedCountry}
                            isDropdownOpen={isDropdownOpen}
                            setIsDropdownOpen={setIsDropdownOpen}
                        />
                    )}

                    {/* Email Address */}
                    <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@domain.co.za"
                            required
                            disabled={loading || isFormLocked}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                        />
                    </div>

                    {/* Password Section */}
                    {mode === 'login' ? (
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
                                    disabled={loading || isFormLocked}
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                                    Password *
                                </label>
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
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                        className={`w-full bg-slate-950/80 border rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono disabled:opacity-50 ${confirmPassword && password !== confirmPassword
                                            ? 'border-rose-500 focus:border-rose-500'
                                            : 'border-slate-800 focus:border-blue-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-rose-400 mt-1 normal-case">
                                        Passwords do not match.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {message.text && <AuthMessage message={message} />}

                    <button
                        type="submit"
                        disabled={loading || isFormLocked}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                    >
                        {isFormLocked
                            ? `Locked (${remainingLockoutSec}s)`
                            : loading
                                ? 'Processing...'
                                : mode === 'login'
                                    ? 'Authorize Session ➔'
                                    : 'Create Account ➔'}
                    </button>

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

function AuthMessage({ message }) {
    return (
        <div
            aria-live="polite"
            className={`p-3 rounded-lg text-[11px] border leading-normal font-mono ${message.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                }`}
        >
            <div className="flex items-center space-x-2">
                <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${message.success ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                />
                <span className="normal-case">{message.text}</span>
            </div>
        </div>
    );
}

function EyeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.147.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
                fillRule="evenodd"
                d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
                clipRule="evenodd"
            />
            <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.271.547c-4.257 0-7.893-2.66-9.336-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02l2.08 2.08a4.001 4.001 0 005.829 5.829z" />
        </svg>
    );
}