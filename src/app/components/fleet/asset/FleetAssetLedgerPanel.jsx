// src/app/components/fleet/asset/FleetAssetLedgerPanel.jsx

'use client';

import React from 'react';

export default function FleetAssetLedgerPanel({ vehicle, onClose, onSelectDelete }) {
    if (!vehicle) return null;

    const l100km = vehicle.combined_mpg ? (235.215 / parseFloat(vehicle.combined_mpg)).toFixed(1) : null;
    const gPerKm = vehicle.co2_tailpipe_gpm ? Math.round(parseFloat(vehicle.co2_tailpipe_gpm) / 1.60934) : null;

    return (
        <div className="p-5 bg-slate-950/80 border border-blue-900/30 rounded-xl font-mono text-xs space-y-4 animate-fade-in shadow-2xl relative traditions-card text-left h-full flex flex-col justify-between  stims-hover-glow transition-all duration-300">
            <div className="space-y-4">
                {/* Header Action Row */}
                <div className="border-b border-slate-900 pb-2.5 flex items-center justify-between gap-4">
                    <div className="truncate">
                        <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-widest">Vehicle Details</span>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                            [{vehicle.registration_number || 'N/A'}]
                        </h4>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelectDelete(vehicle)}
                        className="text-[10px] font-bold border border-rose-950/60 hover:border-rose-500/50 text-rose-500 hover:text-white bg-rose-950/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 uppercase tracking-wider text-center"
                    >
                        Remove Vehicle
                    </button>
                </div>

                {/* Identity Summary Info */}
                <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
                    <p className="text-[11px] text-white font-bold uppercase tracking-wide">
                        {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.classification || 'Standard Vehicle'} • {vehicle.drivetrain || 'Front-Wheel Drive'}
                    </p>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-2 text-slate-400 text-[11px]">
                    <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest block pt-1">Specifications</span>

                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Engine Size:</span>
                        <span className="text-slate-200 font-bold">{vehicle.engine_capacity || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Gearbox Type:</span>
                        <span className="text-slate-200 font-bold uppercase">{vehicle.transmission || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Fuel Type:</span>
                        <span className="text-blue-400 font-bold uppercase">{vehicle.fuel_type || 'Gasoline'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Fuel Economy:</span>
                        <span className="text-slate-200 font-bold">
                            {vehicle.combined_mpg ? `${vehicle.combined_mpg} MPG` : 'N/A'}
                            {l100km && <span className="text-slate-500 font-normal ml-1">({l100km} L/100km)</span>}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Tailpipe CO₂:</span>
                        <span className="text-amber-400 font-bold">
                            {vehicle.co2_tailpipe_gpm ? `${vehicle.co2_tailpipe_gpm} g/mi` : 'N/A'}
                            {gPerKm && <span className="text-amber-500/70 font-normal ml-1">({gPerKm} g/km)</span>}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span>Carbon Score:</span>
                        <span className="text-emerald-400 font-bold">
                            {vehicle.carbon_multiplier ? `${parseFloat(vehicle.carbon_multiplier).toFixed(6)} kg/km` : '0.230000'}
                        </span>
                    </div>
                </div>

                {/* System Record Key */}
                <div className="space-y-1 pt-1">
                    <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block">Vehicle ID Key</span>
                    <div className="select-all font-mono text-[10px] text-blue-400 bg-slate-950 border border-slate-900 p-2 rounded break-all tracking-tighter">
                        {vehicle.id}
                    </div>
                </div>
            </div>
        </div>
    );
}
