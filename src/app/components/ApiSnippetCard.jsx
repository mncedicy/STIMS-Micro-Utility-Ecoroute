// src/app/components/ApiSnippetCard.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ApiSnippetCard({ userId }) {
    const [hostOrigin, setHostOrigin] = useState('https://ecoroute.stims.co.za');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isSaving, setIsSavedState] = useState(false);
    const [statusMessage, setStatusFeedback] = useState({ text: '', type: '' });

    // Instantiate client connection to synchronize webhook routing matrix rows safely
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHostOrigin(window.location.origin);
        }

        // Fetch currently active user webhook callback endpoint URL configuration rule
        async function fetchSavedWebhookConfiguration() {
            if (!userId) return;
            try {
                const { data, error } = await supabase
                    .from('ecoroute_corporate_api_tokens')
                    .select('webhook_destination_url')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (!error && data?.webhook_destination_url) {
                    setWebhookUrl(data.webhook_destination_url);
                }
            } catch (err) {
                console.warn('⚠️ Webhook configurations baseline sync fault:', err.message);
            }
        }

        fetchSavedWebhookConfiguration();
    }, [userId]);

    // Replace your handlePersistWebhookRoute function in src/app/components/ApiSnippetCard.jsx with this:
    const handlePersistWebhookRoute = async (e) => {
        e.preventDefault();
        if (!userId) return;

        const targetUrl = webhookUrl.trim();
        if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            setStatusFeedback({ text: 'Validation Error: Path target matrix must begin with http:// or https://', type: 'error' });
            return;
        }

        setIsSavedState(true);
        setStatusFeedback({ text: '', type: '' });

        try {
            // 1. Fetch existing organization_name to satisfy the NOT NULL database rule constraint
            const { data: existingRow } = await supabase
                .from('ecoroute_corporate_api_tokens')
                .select('organization_name')
                .eq('user_id', userId)
                .maybeSingle();

            const orgName = existingRow?.organization_name || 'Enterprise Profile';

            // 2. Perform upsert including the mandatory organization_name field
            const { error } = await supabase
                .from('ecoroute_corporate_api_tokens')
                .upsert({
                    user_id: userId,
                    organization_name: orgName,
                    webhook_destination_url: targetUrl || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            setStatusFeedback({
                text: targetUrl ? '✓ Webhook destination URL endpoint channel saved successfully.' : '✓ Webhook channel deactivated successfully.',
                type: 'success'
            });
        } catch (err) {
            setStatusFeedback({ text: `Execution Exception Failure: ${err.message}`, type: 'error' });
        } finally {
            setIsSavedState(false);
        }
    };

    return (
        <div className="bg-[#020617]/40 border border-slate-900 rounded-lg p-4 space-y-4 font-mono text-[10px] text-slate-400 leading-normal transition-all duration-300">

            {/* Widget Ribbon Header Container with External Tab Navigation Action */}
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                <span className="text-blue-500 font-bold uppercase tracking-wider">DEVELOPER INTEGRATION SNIPPET</span>
                <a
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none no-underline flex items-center gap-1.5"
                >
                    View Full API Doc ↗
                </a>
            </div>

            {/* Micro Endpoint Target Card Panel */}
            <div className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-slate-900/50">
                <div><span className="text-emerald-500 font-bold">POST</span> {hostOrigin}/api/v1/logistics/audit</div>
                <div><span className="text-slate-500 font-bold">Headers:</span> Authorization: Bearer ecoroute_live_...</div>
            </div>

            {/* NEW ADDITION: Enterprise Webhook Management Destination Control Module Panel */}
            <div className="space-y-2 pt-1">
                <div className="flex flex-col space-y-1">
                    <span className="text-slate-300 font-bold uppercase tracking-wider">WEBHOOK CALLBACK DESTINATION URL</span>
                    <p className="text-[9px] text-slate-500 leading-normal font-sans">
                        Configure a secure programmatic listener channel path endpoint link (e.g. `https://yourdomain.com`). The core ledger dispatch engine streams transactional arrays event tags directly back to this target hook box immediately.
                    </p>
                </div>

                <form onSubmit={handlePersistWebhookRoute} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-backend-listener.com"
                        disabled={isSaving}
                        className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-700 px-3 py-1.5 rounded focus:outline-none focus:border-blue-900 text-[10px] font-mono transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-[9px] px-4 py-1.5 rounded border border-blue-700 hover:border-blue-600 transition-colors disabled:opacity-50 cursor-pointer select-none h-full shrink-0"
                    >
                        {isSaving ? 'Saving...' : 'Save Endpoint'}
                    </button>
                </form>

                {/* Micro Action State Alert Notification Message Banner */}
                {statusMessage.text && (
                    <div className={`text-[9px] font-bold uppercase px-2 py-1 rounded tracking-wide ${statusMessage.type === 'success' ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40' : 'text-rose-400 bg-rose-950/20 border border-rose-900/40'
                        }`}>
                        {statusMessage.text}
                    </div>
                )}
            </div>

        </div>
    );
}
