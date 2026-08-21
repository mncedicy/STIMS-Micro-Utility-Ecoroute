// src/app/components/home/ledger/Ledger.jsx

'use client';

import React from 'react';
import LedgerParametersSummary from './LedgerParametersSummary';

export default function Ledger({ estimate, isPremium }) {
    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative min-h-[260px] flex flex-col justify-between font-mono">
            <div>
                {/* Header Information Bar */}
                <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">AUDIT ESTIMATE REPORT</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded border ${isPremium ? 'border-blue-500/30 text-blue-400 bg-blue-950/20' : 'border-slate-800 text-slate-500 bg-slate-950/40'}`}>
                        {isPremium ? 'PREMIUM ACCESS' : 'FREE TIER'}
                    </span>
                </div>

                {estimate ? (
                    <div className="space-y-4 text-xs animate-fade-in">
                        {/* Upper Classification Banner */}
                        <div className="flex justify-between items-center bg-slate-950/40 p-2 border border-slate-900 rounded">
                            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">CLASSIFICATION TIER</span>
                            <span className="text-blue-400 font-black text-right uppercase tracking-wide">{estimate.category_display}</span>
                        </div>

                        {/* Quantitative Output Display Panels */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg shadow-inner">
                                <div className="text-2xl font-black text-blue-500 tracking-tight">{estimate.carbon_kg}</div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Carbon (KG)</div>
                            </div>
                            <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg shadow-inner">
                                <div className="text-2xl font-black text-slate-200 tracking-tight">{estimate.carbon_mt}</div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Metric Tons (MT)</div>
                            </div>
                        </div>

                        {/* Conversion Variants Footer */}
                        <div className="text-[10px] text-slate-400 bg-slate-950/30 px-2 py-1.5 border border-slate-900/60 rounded flex justify-between font-mono">
                            <span>Pounds: <strong className="text-slate-200">{estimate.carbon_lb} lbs</strong></span>
                            <span>Grams: <strong className="text-slate-200">{estimate.carbon_g ? estimate.carbon_g.toLocaleString() : 0} g</strong></span>
                        </div>

                        {/* Category Parametric Input HUD Tracing Card */}
                        <LedgerParametersSummary log={estimate} />
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-8 text-slate-600 text-xs">
                        <div className="border border-dashed border-slate-800 rounded-md p-4 bg-slate-950/20 max-w-xs leading-relaxed uppercase tracking-wider text-[10px]">
                            ⚡ DEPLOY ROUTE SPECIFICATIONS ON THE LEFT PANEL TO FETCH SYSTEM EMISSIONS REPORT.
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Logger Timestamp Anchor */}
            {estimate?.created_at && (
                <div className="text-[9px] text-slate-600 border-t border-slate-900/60 pt-2 text-right tracking-tight uppercase">
                    JOURNAL DAY: {estimate.emission_date ? new Date(estimate.emission_date).toLocaleDateString('en-ZA') : new Date(estimate.created_at).toLocaleDateString('en-ZA')}
                </div>
            )}
        </div>
    );
}
