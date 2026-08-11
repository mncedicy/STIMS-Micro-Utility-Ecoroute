// /src/app/components/landing/EmissionsChannels.jsx
'use client';

import React from 'react';

export default function EmissionsChannels() {
    return (
        <div className="space-y-6">
            <div className="border-b border-slate-900 pb-2">
                <h2 className="text-xs uppercase tracking-widest text-blue-500 font-bold">1.0 CALCULATOR EMISSIONS CHANNELS</h2>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">Comprehensive GHG footprint assessment tools built natively into the platform core mapping interfaces.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* FIXED: Appended .stims-hover-glow tracking onto individual category tiles */}
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group stims-hover-glow">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-blue-400 font-bold uppercase text-[9px] tracking-wider font-mono">01. LAND VEHICLES</span><span className="text-slate-600 text-[10px]">🚚</span></div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">Register custom trucks and corporate fleet assets. Calculates tailpipe emissions by applying fuel coefficients across distance telemetry metrics natively.</p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60 mt-2 font-mono">Scope 1 Direct Mobile</span>
                </div>

                {/* Aviation Flights */}
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group stims-hover-glow">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider font-mono">02. AVIATION FLIGHTS</span><span className="text-slate-600 text-[10px]">✈️</span></div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">Tracks commercial air travel using airport numeric identifier database lookups. Computes passenger occupant multiplier metrics and relative routing distances.</p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60 mt-2 font-mono">Scope 3 Business Air</span>
                </div>

                {/* Cargo Shipping */}
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group stims-hover-glow">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-purple-400 font-bold uppercase text-[9px] tracking-wider font-mono">03. CARGO SHIPPING</span><span className="text-slate-600 text-[10px]">🚢</span></div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">Log heavy deep-sea container freight. Maps tonnage metrics paired with distance tracks to check logistical impact.</p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60 mt-2 font-mono">Scope 3 Upstream Freight</span>
                </div>

                {/* Power Utilities */}
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group stims-hover-glow">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-amber-400 font-bold uppercase text-[9px] tracking-wider font-mono">04. GRID POWER UTILITIES</span><span className="text-slate-600 text-[10px]">⚡</span></div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">Evaluates high-load warehouse power utility load factors. Maps energy metrics (<code className="text-amber-400 font-mono text-[10px]">kWh</code>) to regional ISO tracking multipliers.</p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60 mt-2 font-mono">Scope 2 Indirect Energy</span>
                </div>

                {/* Gas Combustion */}
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group stims-hover-glow">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-rose-400 font-bold uppercase text-[9px] tracking-wider font-mono">05. GAS FUEL COMBUSTION</span><span className="text-slate-600 text-[10px]">🔥</span></div>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">Monitors direct industrial burner combustion metrics. Supports volume pipelines (<code className="text-rose-400 font-mono text-[10px]">NATURAL_GAS</code>) or cylinder configurations (<code className="text-rose-400 font-mono text-[10px]">LPG</code>).</p>
                    </div>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-widest pt-2 border-t border-slate-900/60 mt-2 font-mono">Scope 1 Direct Stationary</span>
                </div>

                {/* Reconciled Ledger Tag */}
                <div className="p-4 border border-dashed border-slate-900 rounded-xl flex items-center justify-center text-center text-slate-600 font-mono text-[10px] uppercase leading-relaxed tracking-wider">
                    <div>
                        <span className="text-blue-500 font-bold block mb-1">STIMS API RECONCILED</span>
                        ledger rows are locked with cryptographic checksum signatures
                    </div>
                </div>
            </div>
        </div>
    );
}
