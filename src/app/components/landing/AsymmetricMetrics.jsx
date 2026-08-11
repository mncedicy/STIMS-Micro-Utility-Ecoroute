// /src/app/components/landing/AsymmetricMetrics.jsx
'use client';

import React from 'react';

export default function AsymmetricMetrics({ appMeta }) {
    const premiumCapString = (appMeta?.usage_limit_premium || 3000).toLocaleString('en-ZA');

    return (
        <div className="space-y-8 w-full animate-fade-in-up font-mono text-xs">

            {/* Centered Dynamic Subsection Header */}
            <div className="text-center max-w-xl mx-auto space-y-1 select-none">
                <span className="text-blue-500 font-bold uppercase text-[9px] tracking-widest block">
                    CROSS-BORDER COMPLIANCE AUDITING CHANNELS
                </span>
                {/* FIXED: Embedded your exact requested typography heading string perfectly */}
                <h5 className="text-md font-black text-white uppercase tracking-wide">
                    WHY COMPLIANCE TEAMS USE {appMeta?.title || 'ECOROUTE'}
                </h5>
            </div>

            {/* Asymmetric Product Grid Row Layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">

                {/* Left Card: Multi-tenant processing capacity allocations */}
                <div className="md:col-span-2 p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors duration-300 group stims-hover-glow relative overflow-hidden text-left">
                    <div className="space-y-1.5">
                        <span className="text-[32px] font-black text-blue-400 block tracking-tighter leading-none">{premiumCapString}+</span>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider pt-2">COMPLIANCE ACCESS SLOTS</h4>
                        <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed">
                            Enterprise integration pipelines are allocated high-capacity transaction thresholds to handle continuous API data streams without request drops.
                        </p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60">Programmatic Volume Scale</span>
                </div>

                {/* Right Card: International carbon tax exposure explanation */}
                <div className="md:col-span-3 p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors duration-300 group stims-hover-glow relative overflow-hidden text-left">
                    <div className="space-y-3">
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">02. INTERNATIONAL TAX REPORTING</span>
                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide leading-tight">Live monetary liability forecasting for global markets</h4>
                        <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed">
                            EcoRoute translates abstract flight sectors, shipping manifests, and electrical utility load factors into real-world monetary numbers. It matches calculations against international emissions registries, allowing multi-national operators to monitor cross-border climate tax liabilities on the fly.
                        </p>
                    </div>

                    {/* Live Financial Metrics Visualization Indicator Block */}
                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl flex justify-between items-center max-w-md text-slate-400">
                        <div className="flex items-center space-x-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] uppercase font-bold tracking-wider">Scope 2 Grid Factors Registry:</span>
                        </div>
                        <span className="text-blue-400 font-bold tracking-wide text-[9px] uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                            IEA & EPA eGRID SYNCED
                        </span>
                    </div>
                </div>
            </div>

            {/* Lower Row Panel: PDF Summary Documents & 6-Month Chart Preview Canvas */}
            <div className="w-full border border-slate-900 rounded-2xl bg-slate-950/20 overflow-hidden flex flex-col md:flex-row items-stretch transform hover:border-slate-800 transition-colors duration-300 stims-hover-glow">
                <div className="w-full md:w-5/12 p-6 text-left flex flex-col justify-between space-y-4 bg-slate-950/30">
                    <div className="space-y-2">
                        <span className="text-purple-400 font-bold uppercase text-[9px] tracking-widest block">CROSS-BORDER COMPLIANCE READY</span>
                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide leading-snug">Official Greenhouse Gas Protocol PDF Exporters</h4>
                        <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed">
                            Bundle an entire month's operational activities, sort them into strict regulatory frameworks (Scope 1 Direct, Scope 2 Electricity, and Scope 3 Value Chain), and export clean, signed summaries optimized for state environmental tax credit reviews.
                        </p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60">Audit-Ready Documentation</span>
                </div>

                {/* Visual Chart Graphic Track */}
                <div className="w-full md:w-7/12 p-6 bg-slate-950 relative min-h-[160px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-900">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest border-b border-slate-900/60 pb-1.5">
                        <span>ESTIMATED CORPORATE CARBON LIABILITY TREND LINE OVER TIME</span>
                        <span>6 MONTH COMPLIANCE MATRIX ▼</span>
                    </div>
                    <div className="h-20 flex items-end justify-between gap-1 pt-4 relative px-1">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03] py-1"><div className="w-full border-b border-slate-100" /><div className="w-full border-b border-slate-100" /></div>
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t border-t border-blue-500/60 h-[22%]" />
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t border-t border-blue-500/60 h-[38%]" />
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t border-t border-blue-500/60 h-[31%]" />
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t border-t border-blue-500/60 h-[56%]" />
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t border-t border-blue-500/60 h-[72%]" />
                        <div className="flex-1 bg-gradient-to-t from-blue-600/10 to-emerald-400/50 rounded-t border-t border-emerald-400/80 h-[88%]" />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-600 uppercase tracking-widest border-t border-slate-900/60 pt-1.5">
                        <span>FEB 2026</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL 2026</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
