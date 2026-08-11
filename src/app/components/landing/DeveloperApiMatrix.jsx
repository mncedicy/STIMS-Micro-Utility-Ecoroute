// /src/app/components/landing/DeveloperApiMatrix.jsx
'use client';

import React from 'react';

export default function DeveloperApiMatrix({ appMeta }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl font-mono text-[10px] text-left animate-fade-in-up relative z-10">

            {/* Programmatic API Box */}
            <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-800 transition-colors duration-300 stims-hover-glow">
                <div className="space-y-2">
                    <span className="text-blue-400 font-bold uppercase text-[9px] tracking-wider block">PROGRAMMATIC CARBON INTERFACE API</span>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide leading-tight">Secure, Modular REST Endpoint Gateways for Corporate Devs</h4>
                    <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed">
                        External software engineers can send fast JSON payloads directly through our secure bearer gateway token channels. Features built-in dry-run calculation options to test connections instantly without saving duplicate rows to your dashboard history trails.
                    </p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-900 font-mono text-[8px] text-slate-500 space-y-0.5">
                    <div><span className="text-emerald-500 font-bold">POST</span> /api/v1/logistics/audit</div>
                    <div>Authorization: Bearer ecoroute_live_...</div>
                </div>
            </div>

            {/* Volumetric Allocation Limits Box */}
            <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-800 transition-colors duration-300 stims-hover-glow">
                <div className="space-y-2">
                    <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider block">ALLOCATION VOLUMETRIC MATRICES</span>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide leading-tight">Dynamic Multi-Tenant Volumetric Quotas & Auto-Resets</h4>
                    <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed">
                        Monthly request allocations are managed dynamically at the database column row level across all interface platforms uniformly:
                    </p>
                    <ul className="space-y-1 text-slate-300 font-mono text-[9px] pl-0.5 list-none">
                        <li className="flex items-center gap-2"><span className="h-1 w-1 bg-slate-500 rounded-full" /> <span>FREE PLAN TIER: <strong className="text-slate-400">{appMeta.usage_limit_free || 100} requests</strong> / month</span></li>
                        <li className="flex items-center gap-2"><span className="h-1 w-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]" /> <span>PREMIUM PRO TIER: <strong className="text-blue-400">{appMeta.usage_limit_premium || 3000} requests</strong> / month</span></li>
                    </ul>
                </div>
                <div className="text-[8px] bg-slate-950/60 p-2 border border-slate-900 rounded text-slate-500 italic font-sans normal-case">
                    ℹ️ Automated database cron jobs execute every night at midnight to evaluate cycle anniversary thresholds and flush monthly usage back to zero transparently.
                </div>
            </div>

        </div>
    );
}
