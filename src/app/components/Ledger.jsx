// /src/app/components/Ledger.jsx
'use client';

import React from 'react';

export default function Ledger({ estimate, isPremium }) {
    // Dynamic text layout summarizer reads straight from first-class columns
    const renderAuditParametersSummary = (log) => {
        if (!log) return null;

        const category = log.category_display?.toLowerCase();

        return (
            <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg text-[11px] text-slate-400 space-y-1.5 font-mono max-w-full">
                <span className="text-[9px] text-blue-500 font-bold block uppercase tracking-wider mb-1">
                    Verified Audit Input Bounds
                </span>

                {log.vehicle_id && log.input_distance && (
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Distance Run:</span>
                        <span className="text-white font-bold">{log.input_distance} {log.input_unit || 'km'}</span>
                    </div>
                )}
                {category === 'shipping' && log.cargo_weight && (
                    <>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Cargo Freight:</span>
                            <span className="text-white font-bold">{log.cargo_weight} {log.mass_unit}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Transit Distance:</span>
                            <span className="text-white font-bold">{log.input_distance} {log.input_unit}</span>
                        </div>
                    </>
                )}
                {category === 'flight' && log.origin_iata && (
                    <>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Flight Sector Path:</span>
                            <span className="text-blue-400 font-bold uppercase">{log.origin_iata} ➔ {log.dest_iata}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Passengers Pax:</span>
                            <span className="text-white font-bold">{log.passengers_count} pax</span>
                        </div>
                    </>
                )}
                {category === 'electricity' && log.energy_kwh && (
                    <>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Grid Electricity:</span>
                            <span className="text-white font-bold">{log.energy_kwh} kWh</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Utility Grid Region:</span>
                            <span className="text-amber-400 font-bold uppercase">{log.country_code || 'ZA'}</span>
                        </div>
                    </>
                )}
                {category === 'gas' && log.gas_quantity && (
                    <>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Combustion Fuel:</span>
                            <span className="text-white font-bold">{log.gas_quantity} {log.gas_unit}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Gas Profile Type:</span>
                            <span className="text-slate-300 font-bold uppercase">{log.gas_type?.replace('_', ' ')}</span>
                        </div>
                    </>
                )}
            </div>
        );
    };

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
                        {renderAuditParametersSummary(estimate)}
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
                    LEDGER STAMP: {new Date(estimate.created_at).toLocaleString('en-ZA')}
                </div>
            )}
        </div>
    );
}