// /src/app/update-password/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();

    // Listen for the recovery access session token arriving in the browser URL hash fragment
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

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: '❌ Password Conflict: Passwords do not match.' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // Commit the updated password string back to Supabase Auth accounts system database
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            setMsg({ type: 'success', text: '🔒 Security Updated: Password successfully reset! Redirecting to dashboard space...' });

            // Send the authenticated user back to the primary workspace home dashboard after 2 seconds
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err) {
            setMsg({ type: 'error', text: err.message || 'Failed to update system password records.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] text-slate-100 antialiased font-mono text-xs">
            {/* Ambient Radial Spotlight Glow Backdrop */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm bg-slate-900/40 border border-slate-900 rounded-xl p-6 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden z-10 stims-hover-glow">

                {/* Clean Centered Header Area Typography */}
                <div className="text-center border-b border-slate-900 pb-4">
                    <span className="text-[9px] font-mono tracking-widest text-blue-500 uppercase font-bold block mb-1">
                        Security Layer Configuration
                    </span>
                    <h1 className="text-lg font-black text-white uppercase tracking-wide">Choose New Password</h1>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans normal-case">Update your secure access credentials</p>
                </div>

                {/* Status Notification Message Prompt Feedback Banner */}
                {msg.text && (
                    <div className={`p-3 text-[11px] font-mono border leading-normal rounded-lg ${msg.type === 'error'
                        ? 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                        }`}>
                        <div className="flex items-center space-x-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${msg.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <span className="normal-case leading-normal">{msg.text}</span>
                        </div>
                    </div>
                )}

                {/* Hide form inputs if the recovery session validation catches an expired token fragment */}
                {msg.type !== 'error' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors font-mono"
                                required
                                minLength="6"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors font-mono"
                                required
                                placeholder="••••••••"
                                disabled={loading}
                            />
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
