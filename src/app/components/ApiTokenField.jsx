// /src/app/components/ApiTokenField.jsx
'use client';

import React from 'react';

export default function ApiTokenField({ token, revealToken, setRevealToken, handleCopy, copySuccess }) {
    return (
        <div className="space-y-1.5 font-mono">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1.5">X-API-TOKEN AUTHORIZATION BEARER</label>
            <div className="flex gap-2">
                <input
                    type={revealToken ? "text" : "password"}
                    value={token}
                    readOnly
                    className="w-full bg-[#020617] border border-slate-900 focus:border-slate-800 rounded-lg px-3 py-2 text-xs text-blue-400 font-bold font-mono tracking-wide select-all outline-none"
                />
                <button
                    type="button"
                    onClick={() => setRevealToken(!revealToken)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none shrink-0"
                >
                    {revealToken ? "HIDE" : "SHOW"}
                </button>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none shrink-0"
                >
                    {copySuccess ? "COPIED" : "COPY"}
                </button>
            </div>
        </div>
    );
}
