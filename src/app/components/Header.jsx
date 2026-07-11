// src/app/components/Header.jsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header({ user, profile, isPremium, quotaReached, openModal, onSuccess }) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const s = document.createElement("script");
        s.src = "https://paystack.co";
        s.async = true; document.body.appendChild(s);
        return () => { try { document.body.removeChild(s); } catch { } };
    }, []);

    const handlePay = () => {
        if (!window.PaystackPop) return alert("Financial gateway routing layer initializer active. Please try again.");
        setLoading(true);
        window.PaystackPop.setup({
            key: 'pk_test_d3c52e42f22b794121e7fc15332f14aa4283c790',
            email: user.email.trim(), amount: 28000, currency: 'ZAR',
            callback: async (res) => {
                const verify = await fetch(`http://localhost:3000/api/webhooks/paystack`, {
                    method: 'POST', headers: { 'x-paystack-signature': 'local-bypass-verification' },
                    body: JSON.stringify({ event: 'charge.success', data: { reference: res.reference, metadata: { user_id: user.id, app_id: 'ecoroute', tier: 'premium' } } })
                });
                if (verify.ok) onSuccess();
                setLoading(false);
            },
            onClose: () => setLoading(false)
        }).openIframe();
    };

    const name = profile?.first_name || user.user_metadata?.first_name || 'User';
    const comp = isPremium ? (profile?.company || 'Premium Enterprise Member') : 'Independent Free Workspace';

    return (
        <header className="border-b border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end space-y-4 sm:space-y-0 select-none">
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-blue-500 uppercase font-bold">Logistics Audit Fabric</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${isPremium ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400' : 'border-slate-800 bg-slate-950 text-slate-500'
                        }`}>
                        {isPremium ? "Pro Account" : "Sandbox Free"}
                    </span>
                </div>
                <h1 className="text-xl font-bold text-white mt-1 tracking-tight">Welcome, {name}!</h1>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Workspace Scope // <span className={isPremium ? "text-cyan-400 font-medium" : "text-slate-400 font-medium"}>{comp}</span>
                </p>
            </div>

            <div className="flex flex-wrap gap-2 font-mono">
                {!isPremium && (
                    <button onClick={handlePay} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 animate-pulse">
                        {loading ? "Routing Portal..." : "⭐ Upgrade Pro (R280/mo)"}
                    </button>
                )}

                {quotaReached ? (
                    <span className="bg-slate-950 border border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center">
                        🔒 Fleet Cap Reached
                    </span>
                ) : (
                    <button onClick={openModal} className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer">
                        🚗 Add Fleet Car
                    </button>
                )}

                <a href="/api/backup" download className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center">
                    📥 Backup
                </a>

                <button onClick={() => supabase.auth.signOut()} className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer">
                    Sign Out
                </button>
            </div>
        </header>
    );
}
