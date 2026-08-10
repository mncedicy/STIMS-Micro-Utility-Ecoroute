// /src/app/components/CorporateApiPanel.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ApiUsageBar from './ApiUsageBar';
import ApiSnippetCard from './ApiSnippetCard';
import SystemDialogModal from './SystemDialogModal';
import ApiTokenField from './ApiTokenField';

export default function CorporateApiPanel({ user, isPremium }) {
    const [tokenData, setTokenData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, status: 'blue', title: '', message: '', hasCancel: false });

    useEffect(() => {
        async function fetchActiveUserDeveloperToken() {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('ecoroute_corporate_api_tokens')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!error && data) setTokenData(data);
            } catch (err) {
                console.error('[Corporate Api Panel Hydration Crash]:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchActiveUserDeveloperToken();
    }, [user]);

    async function executeTokenResetRoutine() {
        setModal(prev => ({ ...prev, isOpen: false }));
        setResetting(true);
        try {
            const secureHexKey = 'ecoroute_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            const { data, error } = await supabase
                .from('ecoroute_corporate_api_tokens')
                .update({ api_token: secureHexKey, updated_at: new Date().toISOString() })
                .eq('id', tokenData.id)
                .eq('user_id', user.id)
                .select().single();

            if (error) throw error;
            if (data) {
                setTokenData(data);
                setModal({
                    isOpen: true, status: 'green', title: 'SIGNATURE GENERATION SUCCESS', hasCancel: false,
                    message: 'Remote access credential updated. Ensure your server environment keys match the newly provisioned hash signature layout immediately.'
                });
            }
        } catch (err) {
            setModal({
                isOpen: true, status: 'red', title: 'MODIFICATION STATE ERROR', hasCancel: false,
                message: `FAILED TO MERGE SIGNATURE STATE: ${err.message}`
            });
        } finally {
            setResetting(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl font-mono text-xs text-slate-500 animate-pulse select-none uppercase tracking-widest text-center">
                📊 Synchronizing Secure Enterprise Access Signatures Ledger...
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full font-mono animate-fade-in relative text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">CORPORATE API CONFIGURATION PANEL</h2>
                    <p className="text-[11px] text-slate-500 leading-tight">Integrate carbon accounting calculations directly into your multi-modal ERP dispatch scripts.</p>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded border uppercase font-bold tracking-widest ${isPremium ? 'border-blue-500/30 text-blue-400 bg-blue-950/20' : 'border-slate-800 text-slate-500 bg-slate-950/40'}`}>
                    {isPremium ? 'ENTERPRISE API ACCESS' : 'SANDBOX CONSTRAINED'}
                </span>
            </div>

            {tokenData ? (
                <div className="space-y-4">
                    <ApiUsageBar tokenRecord={tokenData} />

                    {/* RENDER NEW EXTRACTED ELEMENT MODULE */}
                    <ApiTokenField
                        tokenData={tokenData}
                        resetting={resetting}
                        onResetPrompt={() => setModal({
                            isOpen: true,
                            status: 'blue',
                            title: 'TOKEN RESET WARNING',
                            message: 'Resetting this secret bearer token will immediately break all live applications, server integrations, and enterprise route systems running on this token footprint. Proceed?',
                            hasCancel: true
                        })}
                    />

                    <ApiSnippetCard userId={user?.id} />
                </div>
            ) : (
                <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/10 uppercase tracking-wider text-[10px]">
                    ⚠️ NO ACTIVE API RECORD DETECTED. RE-ROUTE TO THE DASHBOARD PANEL VIEW TO INITIALIZE COMPLIANCE LOGS ACCESS CHANNELS.
                </div>
            )}

            <SystemDialogModal
                isOpen={modal.isOpen}
                status={modal.status}
                title={modal.title}
                message={modal.message}
                confirmText={modal.hasCancel ? "CONFIRM RESET" : "ACKNOWLEDGE"}
                onConfirm={modal.hasCancel ? executeTokenResetRoutine : () => setModal(prev => ({ ...prev, isOpen: false }))}
                onCancel={modal.hasCancel ? () => setModal(prev => ({ ...prev, isOpen: false })) : null}
            />
        </div>
    );
}
