'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthScreen({ onAuthSuccess }) {
    // UI view state tracks: 'login', 'signup', or 'recovery'
    const [viewState, setViewState] = useState('login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');

    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            if (viewState === 'signup') {
                // 1. Account Creation Pipeline
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // FIXED: Adjusted user metadata object maps to match your database triggers exactly
                        data: {
                            first_name: name.trim(),
                            surname: surname.trim(),
                            company: company.trim()
                        }
                    }
                });
                if (error) throw error;
                setMsg({ type: 'success', text: 'Account registered successfully! You can now log in.' });
                setViewState('login');
            } else if (viewState === 'login') {
                // 2. Core Authentication Sign-In Pipeline
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuthSuccess();
            } else if (viewState === 'recovery') {
                // 3. Forgot Password Recovery Overlay Pipeline
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/update-password`,
                });
                if (error) throw error;
                setMsg({
                    type: 'success',
                    text: `Recovery instructions processed for "${email}". If the profile exists, an endpoint token route link has been queued.`
                });
                setViewState('login');
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.message || 'Authentication framework connection fault.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        /* FIXED: Applied your clean top center layout bounds with functional backdrop blur rules */
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in mx-auto relative overflow-hidden font-mono">

            {/* Decorative Branding Highlights */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center border-b border-slate-800 pb-4">
                <h1 className="text-xl font-black text-white uppercase tracking-wide">
                    {viewState === 'signup' && 'Create Corporate Account'}
                    {viewState === 'login' && 'EcoRoute Sign In'}
                    {viewState === 'recovery' && 'Password Recovery'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    {viewState === 'signup' && 'Configure custom fleets and tracking bounds'}
                    {viewState === 'login' && 'Manage compliance logs and custom fleet cars'}
                    {viewState === 'recovery' && 'Enter your verified address to receive an entry token'}
                </p>
            </div>

            {msg.text && (
                <div className={`p-3 text-xs rounded-lg border font-mono ${msg.type === 'error' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                {/* Render Sign Up Specific Metadata Fields */}
                {viewState === 'signup' && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Surname</label>
                            <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</label>
                            <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors" required />
                        </div>
                    </div>
                )}

                {/* Global Identity Input Field (Required for all three states) */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors" required />
                </div>

                {/* Render Secret Input Field (Hidden during password recovery view mode) */}
                {viewState !== 'recovery' && (
                    <div className="space-y-1 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>

                            {viewState === 'login' && (
                                <button type="button" onClick={() => { setMsg({ type: '', text: '' }); setViewState('recovery'); }} className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer bg-transparent border-none p-0">
                                    Forgot Password?
                                </button>
                            )}
                        </div>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors" required />
                    </div>
                )}

                {/* MODIFIED: Mixed your main system layout gradients with the stims-hover-glow utility tags */}
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-[0.99] cursor-pointer stims-hover-glow shadow-sm uppercase tracking-wider">
                    {loading ? 'Processing Transaction...' : ''}
                    {!loading && viewState === 'login' && 'Secure Login Instance'}
                    {!loading && viewState === 'signup' && 'Register Corporate Access'}
                    {!loading && viewState === 'recovery' && 'Request Recovery Link'}
                </button>
            </form>

            <div className="text-center pt-3 border-t border-slate-800/60 flex flex-col space-y-1.5">
                {viewState !== 'login' && (
                    <button onClick={() => { setMsg({ type: '', text: '' }); setViewState('login'); }} className="text-xs text-slate-500 hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none p-0">
                        ➔ Back to account sign in view
                    </button>
                )}

                {viewState === 'login' && (
                    <button onClick={() => { setMsg({ type: '', text: '' }); setViewState('signup'); }} className="text-xs text-slate-500 hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none p-0">
                        Need corporate access? Create an account here
                    </button>
                )}
            </div>

        </div>
    );
}
