// src\app\components\developer\ApiTokenField.jsx

'use client';

import React, { useState } from 'react';

export default function ApiTokenField({ tokenData, resetting, onResetPrompt }) {
    const [revealToken, setRevealToken] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleCopyToClipboard() {
        if (!tokenData?.api_token) return;
        try {
            await navigator.clipboard.writeText(tokenData.api_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('[Token Clipboard Write Failure]:', err);
        }
    }

    return (
        <div className="p-4 bg-slate-900/20 border border-slate-800 rounded-lg space-y-2 font-mono text-xs">
            <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                YOUR SECRET INTEGRATION BEARER TOKEN
            </label>
            <div className="flex items-center gap-2">
                <input
                    type={revealToken ? 'text' : 'password'}
                    value={tokenData?.api_token || ''}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 outline-none tracking-wide select-all"
                />

                {/* REVEAL ACTION BUTTON */}
                <button
                    type="button"
                    onClick={() => setRevealToken(!revealToken)}
                    title={revealToken ? 'Hide Token' : 'Reveal Token'}
                    className="border border-slate-800 text-slate-300 hover:text-white h-8 w-8 flex items-center justify-center rounded bg-slate-950 shrink-0 cursor-pointer transition-colors"
                >
                    {revealToken ? '🔒' : '👁️'}
                </button>

                {/* CLIPBOARD EXTRACTION BUTTON */}
                <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    title="Copy Token"
                    className={`border h-8 px-3 flex items-center justify-center gap-1.5 rounded uppercase font-bold text-[10px] tracking-wider bg-slate-950 shrink-0 cursor-pointer transition-colors ${copied ? 'border-green-800 text-green-400 bg-green-950/10' : 'border-slate-800 text-slate-300 hover:text-white'
                        }`}
                >
                    {copied ? '✅ COPIED' : '📋 COPY'}
                </button>

                {/* DESTRUCTIVE ACTION RESET ENGINE BUTTON */}
                <button
                    type="button"
                    onClick={onResetPrompt}
                    disabled={resetting}
                    title="Reset Token"
                    className="border border-red-900 text-red-400 hover:text-red-300 disabled:text-slate-600 disabled:border-slate-900 h-8 px-3 rounded uppercase font-bold text-[10px] tracking-wider bg-slate-950 shrink-0 cursor-pointer hover:bg-red-950/10 transition-colors"
                >
                    {resetting ? '♻️' : '🔄 RESET'}
                </button>
            </div>
            <p className="text-[9px] text-slate-500 italic leading-tight">
                Keep this access signature token safe. Do not leak credentials inside front-facing source code client browsers.
            </p>
        </div>
    );
}
