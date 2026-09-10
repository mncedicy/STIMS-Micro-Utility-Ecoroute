// src/app/components/fleet/asset/FleetAssetRow.jsx

'use client';

import React from 'react';

// Render for Mobile Media Layout Viewports
export function FleetMobileCard({ vehicle, index, isSelected, onSelectVehicle }) {
    return (
        <div
            onClick={() => onSelectVehicle(vehicle)}
            className={`p-3.5 border rounded-lg space-y-1 text-xs relative cursor-pointer transition-all flex items-start gap-3 ${isSelected
                ? 'border-blue-500 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'bg-slate-950/70 border-slate-800/80 active:border-blue-500'
                }`}
        >
            <span className={`text-[10px] font-bold font-mono mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`}>{index}</span>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm tracking-wider uppercase transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-100'}`}>
                        {vehicle.registration_number || 'UNREGISTERED'}
                    </span>
                </div>
                <div className={`text-[11px] font-semibold uppercase transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
            </div>
        </div>
    );
}

// Render for Tabular Desktop Layout Viewports
export function FleetDesktopRow({ vehicle, index, isSelected, onSelectVehicle }) {
    return (
        <tr
            onClick={() => onSelectVehicle(vehicle)}
            className={`transition-all duration-200 cursor-pointer border-b border-slate-900/60 ${isSelected
                ? 'border-blue-500/80 bg-slate-900/90 shadow-[0_0_25px_3px_rgba(59,130,246,0.25),inset_0_0_12px_1px_rgba(59,130,246,0.1)] text-blue-400 font-bold'
                : 'hover:border-blue-500/80 hover:bg-slate-900/90 hover:shadow-[0_0_25px_3px_rgba(59,130,246,0.25),inset_0_0_12px_1px_rgba(59,130,246,0.1)]'
                } group`}
        >
            {/* 0. INCREMENTAL SERIAL INDEX COLUMN */}
            <td className={`py-3.5 px-3 font-mono text-[10px] font-bold select-none transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-600'}`}>
                {index}
            </td>

            {/* 1. REGISTRATION PLATE */}
            <td className={`py-3.5 px-3 font-mono font-bold tracking-wider uppercase text-xs transition-colors ${isSelected ? 'text-blue-400' : 'text-slate-100 group-hover:text-blue-400'}`}>
                {vehicle.registration_number || 'N/A'}
            </td>

            {/* 2. MANUFACTURER REGISTRY */}
            <td className={`py-3.5 px-3 font-bold uppercase transition-colors ${isSelected ? 'text-slate-200' : 'text-slate-300'}`}>
                {vehicle.year} {vehicle.make} {vehicle.model}
            </td>
        </tr>
    );
}
