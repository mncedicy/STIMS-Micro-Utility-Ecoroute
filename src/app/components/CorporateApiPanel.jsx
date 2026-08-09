// /src/app/components/CorporateApiPanel.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ApiUsageBar from './ApiUsageBar';
import ApiSnippetCard from './ApiSnippetCard';

export default function CorporateApiPanel({ user, isPremium }) {
    const [tokenData, setTokenData] = useState(null);
    const [revealToken, setRevealToken] = useState(false);
    const [loading, setLoading] = useState(true);

    // FIXED AUTO-FETCH LAYOUT: Queries the token registry table row directly from memory on mount to prevent estimate parameter undefined exceptions
    useEffect(() => {
        async function fetchActiveUserDeveloperToken() {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('ecoroute_corporate_api_tokens')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!error && data) {
                    setTokenData(data);
                }
            } catch (err) {
                console.error('[Corporate Api Panel Hydration Crash]:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchActiveUserDeveloperToken();
    }, [user]);

    if (loading) {
        return (
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl font-mono text-xs text-slate-500 animate-pulse select-none uppercase tracking-widest text-center">
                📊 Synchronizing Secure Enterprise Access Signatures Ledger...
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full font-mono animate-fade-in relative text-xs">
            {/* Upper Content Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">CORPORATE API CONFIGURATION PANEL</h2>
                    <p className="text-[11px] text-slate-500 leading-tight">Integrate carbon accounting calculations directly into your multi-modal ERP dispatch scripts.</p>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded border self-start sm:self-center uppercase font-bold tracking-widest font-mono ${isPremium ? 'border-blue-500/30 text-blue-400 bg-blue-950/20' : 'border-slate-800 text-slate-500 bg-slate-950/40'}`}>
                    {isPremium ? 'ENTERPRISE API ACCESS' : 'SANDBOX CONSTRAINED'}
                </span>
            </div>

            {tokenData ? (
                <div className="space-y-4">
                    {/* FIXED: Passes the securely resolved tokenData row straight into your updated ApiUsageBar component */}
                    <ApiUsageBar tokenRecord={tokenData} />

                    {/* Secret Token Field Output Panel */}
                    <div className="p-4 bg-slate-900/20 border border-slate-800 rounded-lg space-y-2">
                        <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-widest">YOUR SECRET INTEGRATION BEARER TOKEN</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type={revealToken ? 'text' : 'password'}
                                value={tokenData.api_token || ''}
                                readOnly
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-mono text-xs outline-none tracking-wide select-all"
                            />
                            <button
                                type="button"
                                onClick={() => setRevealToken(!revealToken)}
                                className="border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded uppercase font-bold text-[10px] tracking-wider transition-colors cursor-pointer bg-slate-950 whitespace-nowrap shrink-0"
                            >
                                {revealToken ? '🔒 Hide Token' : '👁️ Reveal Token'}
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-500 italic leading-tight">Keep this access signature token safe. Do not leak credentials inside front-facing source code client browsers.</p>
                    </div>

                    {/* Interactive Code Blueprint Documentation Snippet Component */}
                    <ApiSnippetCard userId={user?.id} />
                </div>
            ) : (
                <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                    <div className="max-w-xs mx-auto leading-relaxed uppercase tracking-wider text-[10px]">
                        ⚠️ NO ACTIVE API RECORD DETECTED. RE-ROUTE TO THE DASHBOARD PANEL VIEW TO INITIALIZE COMPLIANCE LOGS ACCESS CHANNELS.
                    </div>
                </div>
            )}
        </div>
    );
}
