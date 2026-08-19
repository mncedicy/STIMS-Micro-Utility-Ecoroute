'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Retry attempts state (Max 3 attempts)
    const [attemptsLeft, setAttemptsLeft] = useState(3);

    const router = useRouter();

    // Listen for the recovery access session token arriving in the browser URL
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error || !session) {
                setMsg({
                    type: 'error',
                    text: '⚠️ Recovery Link Expired: This recovery window or access token has expired or is invalid. Please request a new link.'
                });
            }
        });
    }, []);

    // Safely sign out and navigate back home without leaving an active session active
    const handleReturnHome = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error on password reset return:', err);
        } finally {
            router.push('/');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        // Check for password mismatch
        if (password !== confirmPassword) {
            const nextAttempts = attemptsLeft - 1;
            setAttemptsLeft(nextAttempts);

            if (nextAttempts <= 0) {
                setMsg({
                    type: 'error',
                    text: '❌ Maximum Retries Exceeded: Too many failed password attempts. Please request a new recovery link.'
                });
            } else {
                setMsg({
                    type: 'mismatch',
                    text: `❌ Password Conflict: Passwords do not match. (${nextAttempts} attempt${nextAttempts === 1 ? '' : 's'} remaining)`
                });
            }
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // Commit updated password back to Supabase
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            setMsg({ type: 'success', text: '🔒 Security Updated: Password successfully reset! Redirecting to dashboard space...' });

            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err) {
            setMsg({ type: 'error', text: err.message || 'Failed to update system password records.' });
        } finally {
            setLoading(false);
        }
    };

    // Helper to reset error state and let user retry password entry
    const handleTryAgain = () => {
        setPassword('');
        setConfirmPassword('');
        setMsg({ type: '', text: '' });
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] text-slate-100 antialiased font-mono text-xs">
            {/* Ambient Radial Spotlight Glow Backdrop */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm bg-slate-900/40 border border-slate-900 rounded-xl p-6 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden z-10 stims-hover-glow">

                {/* Header Area */}
                <div className="text-center border-b border-slate-900 pb-4">
                    <span className="text-[9px] font-mono tracking-widest text-blue-500 uppercase font-bold block mb-1">
                        Security Layer Configuration
                    </span>
                    <h1 className="text-lg font-black text-white uppercase tracking-wide">Choose New Password</h1>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans normal-case">Update your secure access credentials</p>
                </div>

                {/* Status Notification Message Prompt Feedback Banner */}
                {msg.text && (
                    <div className={`p-3 text-[11px] font-mono border leading-normal rounded-lg ${msg.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                        }`}>
                        <div className="flex items-center space-x-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="normal-case leading-normal">{msg.text}</span>
                        </div>
                    </div>
                )}

                {/* Option 1: Mismatch error with retries remaining */}
                {msg.type === 'mismatch' ? (
                    <div className="space-y-3 pt-2 text-center">
                        <button
                            type="button"
                            onClick={handleTryAgain}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-blue-600/20"
                        >
                            🔄 Try Again ({attemptsLeft} Left)
                        </button>
                    </div>
                ) : msg.type === 'error' ? (
                    /* Option 2: Expired Token / Max Retries Exceeded / Critical Error */
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={handleReturnHome}
                            className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer"
                        >
                            ◀ Return to Home / Request New Link
                        </button>
                    </div>
                ) : (
                    /* Option 3: Standard Form */
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors font-mono"
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors font-mono"
                                    required
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {/* Submission Trigger Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center justify-center space-x-2 stims-hover-glow transform hover:-translate-y-0.5 duration-150 disabled:bg-blue-800 disabled:cursor-not-allowed select-none"
                        >
                            <span>{loading ? 'Updating Security Layer...' : 'Confirm Password Reset ➔'}</span>
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}

function EyeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.147.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
            <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.271.547c-4.257 0-7.893-2.66-9.336-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02l2.08 2.08a4.001 4.001 0 005.829 5.829z" />
        </svg>
    );
}