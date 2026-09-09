// src/app/components/home/ledger/details/SpecialAuditDetails.jsx
'use client';

import React from 'react';

export default function SpecialAuditDetails({ log, meta, formatDuration, renderTrips }) {
    if (log.category_display === 'ROUTE CHECKER') {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Vehicle Specs:</span>
                    <span className="text-blue-400 font-bold uppercase truncate max-w-[150px]">
                        {meta.vehicleDescription}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Total Driving Transit:</span>
                    <span className="text-white font-bold">{log.input_distance} KM</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Total Travel Duration:</span>
                    <span className="text-blue-400 font-bold">{formatDuration(meta.totalDurationSeconds)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Emissions Intensity:</span>
                    <span className="text-slate-300 font-bold">
                        {typeof meta.carbonMultiplierApplied === 'number'
                            ? meta.carbonMultiplierApplied.toFixed(6)
                            : meta.carbonMultiplierApplied} kg CO₂/km
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Projected Fuel:</span>
                    <span className="text-amber-400 font-bold">{meta.projectedFuelLitres} Litres</span>
                </div>
                {renderTrips(meta.tripLegsArray, meta.waypointsArray)}
            </div>
        );
    }

    if (meta.isTaxEngineOutput || log.category_display === 'CARBON TAX REPORT') {
        return (
            <div className="space-y-3 animate-fade-in">
                {/* Core Financial Regulation Metrics Grid Matrix */}
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Statutory Base Rate:</span>
                        <span className="text-slate-300 font-bold">R {parseFloat(meta.statutoryBaseRate || 190).toFixed(2)} / tonne</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Basic Free Allowance:</span>
                        <span className="text-blue-400 font-bold">{meta.freeBasicExemption || "60%"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Taxable Volume:</span>
                        <span className="text-white font-bold">{parseFloat(meta.taxableEmissionsVolumeMt || 0).toFixed(4)} MT</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Total Accrued Liability:</span>
                        <span className="text-emerald-400 font-black">R {parseFloat(meta.totalAccruedLiabilityZar || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Newly Added Injected Analysis Breakdown Ledger Block */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                    <h5 className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-2">
                        📋 Compiled Auditor Source Ledger Context
                    </h5>
                    <div className="bg-slate-950/60 rounded border border-slate-900 p-2.5 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Entries Analyzed:</span>
                            <span className="text-white font-bold">{meta.recordsCompiled || 0} rows</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Analysis Window Start:</span>
                            <span className="text-slate-300 font-mono">{meta.filterApplied?.start_date || '2026-08-09'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Analysis Window End:</span>
                            <span className="text-slate-300 font-mono">{meta.filterApplied?.end_date || '2026-09-09'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
