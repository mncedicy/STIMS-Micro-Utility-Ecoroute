'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Ticker from '../components/Ticker';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
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
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 antialiased font-sans">
            <Ticker />

            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="text-center border-b border-slate-800 pb-4">
                    <h1 className="text-xl font-black text-white">Choose New Password</h1>
                    <p className="text-xs text-slate-400 mt-1">Update your secure access credentials</p>
                </div>

                {msg.text && (
                    <div className={`p-3 text-xs rounded-lg border ${msg.type === 'error' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}>
                        {msg.text}
                    </div>
                )}

                {/* Hide form inputs if the recovery session validation catches an expired token */}
                {msg.type !== 'error' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-[0.99] cursor-pointer shadow-md"
                        >
                            {loading ? 'Updating Security Layer...' : 'Confirm Password Reset'}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
