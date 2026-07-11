// src/app/components/Header.jsx
'use client';
import { useTransition } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header({ user, profile, isPremium, quotaReached, openModal, onSuccess }) {
    const [isPending, startTransition] = useTransition();

    const handlePay = () => {
        if (!user?.id || !user?.email) return alert("Session expired. Please log in.");

        startTransition(async () => {
            try {
                // Safe outbound fetch straight to your local Next.js Route Handler file
                const res = await fetch('/api/checkout/initialize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, userEmail: user.email })
                });

                const result = await res.json();

                if (result && result.success && result.url) {
                    // Direct absolute window jump straight to Paystack's hosted transaction gateway
                    window.location.href = result.url;
                } else {
                    alert(result?.error || "Ecosystem billing initialization failed.");
                }
            } catch (err) {
                alert("Connection Error: Could not connect to internal routing channels.");
            }
        });
    };

    const handleCancelSubscription = () => {
        const confirmCancel = window.confirm("Are you sure you want to cancel your EcoRoute Pro Subscription? You will instantly lose access to PDF reporting certificates and unlimited fleet profiles.");
        if (!confirmCancel) return;

        startTransition(async () => {
            try {
                const res = await fetch('/api/checkout/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                const result = await res.json();
                if (result && result.success) {
                    alert("Your workspace subscription profile has been successfully reset back to the free tier level.");
                    onSuccess();
                } else {
                    alert(result?.error || "Cancellation request rejected.");
                }
            } catch (err) { alert("Network error connecting to payment gateway."); }
        });
    };

    const name = profile?.first_name || user.user_metadata?.first_name || 'User';
    const comp = isPremium ? (profile?.company || 'Premium Enterprise Member') : 'Independent Free Workspace';

    return (
        <header className="border-b border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end space-y-4 sm:space-y-0 select-none w-full relative z-10 font-sans">
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-blue-500 uppercase font-bold">Logistics Audit Fabric</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${isPremium ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400' : 'border-slate-800 bg-slate-950 text-slate-500'
                        }`}>
                        {isPremium ? "Pro Active" : "Sandbox Free"}
                    </span>
                </div>
                <h1 className="text-xl font-bold text-white mt-1 tracking-tight">Welcome, {name}!</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                    Workspace Scope // <span className={isPremium ? "text-cyan-400 font-bold" : "text-slate-400 font-medium"}>{comp}</span>
                </p>
            </div>

            <div className="flex flex-wrap gap-2 font-mono">
                {!isPremium ? (
                    <button
                        onClick={handlePay}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 animate-pulse cursor-pointer"
                    >
                        {isPending ? "Routing Portal..." : "⭐ Upgrade Pro (R280/mo)"}
                    </button>
                ) : (
                    <button
                        onClick={handleCancelSubscription}
                        disabled={isPending}
                        className="bg-slate-950 border border-red-950/40 hover:border-red-900/60 text-red-400 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                    >
                        {isPending ? "Cancelling..." : "🚫 Cancel Pro Subscription"}
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
