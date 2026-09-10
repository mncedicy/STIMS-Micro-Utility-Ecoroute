// src/app/components/fleet/history/VehicleHistorySummary.jsx

'use client';

import React, { useState } from 'react';
import ExportModal from '../../emission/log/ExportModal';

export default function VehicleHistorySummary({ vehicle, vehicleLogs = [], user, customVehicles = [] }) {
    const [isExportOpen, setIsExportOpen] = useState(false);

    if (!vehicle) return null;

    const totalRuns = vehicleLogs.length;
    const totalKg = vehicleLogs.reduce((acc, curr) => acc + parseFloat(curr.carbon_kg || 0), 0);
    const totalDistance = vehicleLogs.reduce((acc, curr) => acc + parseFloat(curr.input_distance || 0), 0);

    const avgIntensity = totalDistance > 0 ? (totalKg / totalDistance).toFixed(4) : '0.0000';
    const totalMT = (totalKg / 1000).toFixed(4);

    // Create a bulk batch object parameter signature matching your document export modal structure
    const compiledMockVehicleNode = {
        id: `BATCH_INDEX_SET_${vehicleLogs.length}_NODES`,
        category_display: 'VEHICLE',
        vehicle_id: vehicle.id
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl font-mono text-xs space-y-4 flex flex-col justify-between h-[340px] stims-hover-glow transition-all duration-300 relative">
            <div>
                {/* Header Context Bar */}
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                        <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-widest">Total Carbon Summary</span>
                        <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide truncate max-w-[140px]">
                            [{vehicle.registration_number}] Carbon History
                        </h4>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsExportOpen(true)}
                            className="border border-blue-900 hover:border-blue-500 bg-blue-950/40 text-blue-400 hover:text-white text-[9px] font-bold py-1 px-2.5 rounded transition-all uppercase tracking-wider shrink-0 shadow-sm stims-hover-glow cursor-pointer"
                        >
                            🚀 Export
                        </button>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-950 border border-blue-900/40 text-blue-400 uppercase">
                            Total Trips: {totalRuns}
                        </span>
                    </div>
                </div>

                {/* Big Metric Display Box */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="p-3 bg-[#020617]/60 border border-slate-900 rounded-lg flex flex-col justify-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Carbon Weight</span>
                        <p className="text-lg font-black text-rose-500 tracking-tight mt-1">
                            {totalKg.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">KG</span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">[{totalMT} Tons]</span>
                    </div>

                    <div className="p-3 bg-[#020617]/60 border border-slate-900 rounded-lg flex flex-col justify-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Distance Driven</span>
                        <p className="text-lg font-black text-blue-400 tracking-tight mt-1">
                            {totalDistance.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">KM</span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5">From tracked trips</span>
                    </div>
                </div>

                {/* Average Parameters Stack */}
                <div className="space-y-1.5 pt-4 text-slate-400 text-[11px]">
                    <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span>Average Carbon per KM:</span>
                        <span className="text-emerald-400 font-bold">{avgIntensity} <span className="text-[9px] font-normal text-slate-500">kg/km</span></span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span>Vehicle Multiplier Key:</span>
                        <span className="text-slate-200 font-bold">{parseFloat(vehicle.carbon_multiplier || 0.23).toFixed(6)}</span>
                    </div>
                </div>
            </div>

            {/* Simple Descriptive Box Footer */}
            <div className="p-2.5 bg-slate-950 border border-slate-900 text-slate-500 text-[10px] rounded leading-normal flex items-start space-x-1.5 shrink-0 normal-case font-sans">
                <span className="shrink-0 text-blue-500 font-mono text-xs">ℹ️</span>
                <span>
                    This panel displays carbon calculations matching national carbon guidelines for South African standard vehicle emissions tracking rows.
                </span>
            </div>

            {/* Integrated Export Modal Mounting Element */}
            {isExportOpen && (
                <ExportModal
                    user={user}
                    inspectedLogNode={compiledMockVehicleNode}
                    customVehicles={customVehicles.length > 0 ? customVehicles : [vehicle]}
                    selectedFilterVehicleId={vehicle.id}
                    onClose={() => setIsExportOpen(false)}
                    startDate=""
                    endDate=""
                />
            )}
        </div>
    );
}
