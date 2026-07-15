'use client';

import React from 'react';

export default function Ledger({ estimate, isPremium }) {
    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative min-h-[260px] flex flex-col justify-between font-mono">
            <div>
                <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">AUDIT ESTIMATE REPORT</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded border ${isPremium ? 'border-blue-500/30 text-blue-400 bg-blue-950/20' : 'border-slate-800 text-slate-500 bg-slate-950/40'}`}>
                        {isPremium ? 'PREMIUM ACCESS' : 'FREE TIER'}
                    </span>
                </div>

                {estimate ? (
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center bg-slate-950/40 p-2 border border-slate-900 rounded">
                            <span className="text-slate-500 text-[11px]">CLASSIFICATION</span>
                            <span className="text-slate-200 text-right truncate max-w-[180px]">{estimate.category_display}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-950/60 border border-slate-900 p-2 rounded">
                                <div className="text-xl font-bold text-blue-400">{estimate.carbon_kg}</div>
                                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Carbon (KG)</div>
                            </div>
                            <div className="bg-slate-950/60 border border-slate-900 p-2 rounded">
                                <div className="text-xl font-bold text-slate-300">{estimate.carbon_mt}</div>
                                <div className="text-[9px] text-slate-500 uppercase mt-0.5">Metric Tons</div>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 flex justify-between px-1">
                            <span>Pounds: {estimate.carbon_lb} lbs</span>
                            <span>Grams: {estimate.carbon_g} g</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-8 text-slate-600 text-xs">
                        <div className="border border-dashed border-slate-800 rounded-md p-4 bg-slate-950/20">
                            ⚡ DEPLOY ROUTE SPECIFICATIONS ON THE LEFT PANEL TO FETCH SYSTEM EMISSIONS REPORT.
                        </div>
                    </div>
                )}
            </div>

            {estimate?.estimated_at && (
                <div className="text-[9px] text-slate-600 border-t border-slate-900 pt-2 text-right">
                    TIMESTAMP: {new Date(estimate.estimated_at).toISOString()}
                </div>
            )}
        </div>
    );
}
