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
                    <span className="text-slate-300 font-bold">{meta.carbonMultiplierApplied} kg CO₂/km</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Projected Fuel:</span>
                    <span className="text-amber-400 font-bold">{meta.projectedFuelLitres} Litres</span>
                </div>
                {renderTrips(meta.tripLegsArray, meta.waypointsArray)}
            </div>
        );
    }

    if (meta.isTaxEngineOutput) {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Statutory Base Rate:</span>
                    <span className="text-slate-300 font-bold">R {meta.statutoryBaseRate?.toFixed(2)} / tonne</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Basic Free Allowance:</span>
                    <span className="text-blue-400 font-bold">{meta.freeBasicExemption}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Taxable Volume:</span>
                    <span className="text-white font-bold">{meta.taxableEmissionsVolumeMt?.toFixed(4)} MT</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Total Accrued Liability:</span>
                    <span className="text-emerald-400 font-black">R {meta.totalAccruedLiabilityZar?.toFixed(2)}</span>
                </div>
            </div>
        );
    }

    return null;
}
