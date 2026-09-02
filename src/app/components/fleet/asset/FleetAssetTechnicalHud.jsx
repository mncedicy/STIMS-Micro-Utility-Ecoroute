// src/app/components/fleet/asset/FleetAssetTechnicalHud.jsx

'use client';

import React from 'react';

export default function FleetAssetTechnicalHud({ selectedModelData }) {
    if (!selectedModelData) return null;

    // 1. Extract values with defensive fallback checks
    const combMpg = parseFloat(selectedModelData.comb_mpg_1 || selectedModelData.comb_mpg || 0);
    const co2Gpm = parseFloat(selectedModelData.co2_tailpipe_gpm || selectedModelData.co2_tailpipe || 0);

    const displRaw = selectedModelData.displacement_liters || selectedModelData.displ;
    const displacementValue = displRaw && displRaw !== 'N/A'
        ? (String(displRaw).includes('L') ? displRaw : `${parseFloat(displRaw).toFixed(1)}L`)
        : 'N/A';

    const fuelType = selectedModelData.fuel_type_1 || selectedModelData.fuel_type || 'Gasoline';
    const transmission = selectedModelData.trany || selectedModelData.transmission || 'Standard';
    const vClass = selectedModelData.v_class || selectedModelData.class || 'Standard Vehicle';
    const driveAxle = selectedModelData.drive || 'N/A';

    // 2. Compute carbon_multiplier (kg CO2 per km) matching FleetAssetManager.jsx logic
    let calculatedMultiplier = 0.23; // Schema fallback default

    if (co2Gpm > 0) {
        calculatedMultiplier = (co2Gpm / 1.60934) / 1000;
    } else if (combMpg > 0) {
        const isDiesel = fuelType.toLowerCase().includes('diesel');
        const kgPerGallon = isDiesel ? 10.15 : 8.89;
        calculatedMultiplier = ((1 / combMpg) * kgPerGallon) / 1.60934;
    }

    const formattedMultiplier = calculatedMultiplier.toFixed(6);

    // 3. Conversions for imperial to metric secondary displays
    const l100km = combMpg > 0 ? (235.215 / combMpg).toFixed(1) : null;
    const gPerKm = co2Gpm > 0 ? Math.round(co2Gpm / 1.60934) : null;

    return (
        <div className="mt-3 p-3 bg-slate-950/80 border border-blue-900/40 rounded-lg shadow-inner font-mono text-xs space-y-2.5 animate-fade-in">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2 truncate pr-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider truncate">
                        {selectedModelData.year} {selectedModelData.make} {selectedModelData.model}
                    </span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-950 border border-blue-800/50 text-blue-400 uppercase shrink-0">
                    {fuelType}
                </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-400">
                {/* Vehicle Classification */}
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                    <span>Classification:</span>
                    <span className="text-blue-400 font-bold truncate max-w-[140px] text-right" title={vClass}>
                        {vClass}
                    </span>
                </div>

                {/* Drivetrain & Axle */}
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                    <span>Drivetrain:</span>
                    <span className="text-slate-200 font-bold truncate max-w-[140px] text-right" title={driveAxle}>
                        {driveAxle}
                    </span>
                </div>

                {/* Engine / Transmission */}
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                    <span>Engine / Trans:</span>
                    <span className="text-slate-200 font-bold truncate max-w-[140px] text-right" title={`${displacementValue} • ${transmission}`}>
                        {displacementValue} {selectedModelData.cylinder ? `(${selectedModelData.cylinder} Cyl)` : ''}
                    </span>
                </div>

                {/* Carbon Multiplier */}
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                    <span>Carbon Multiplier:</span>
                    <span className="text-emerald-400 font-bold">
                        {formattedMultiplier} <span className="text-[10px] text-slate-500 font-normal">kg/km</span>
                    </span>
                </div>

                {/* Fuel Economy (MPG & L/100km) */}
                <div className="flex justify-between border-b sm:border-none border-slate-900/80 pb-1 sm:pb-0">
                    <span>Combined FE:</span>
                    <span className="text-white font-bold">
                        {combMpg > 0 ? `${combMpg} MPG` : 'N/A'}
                        {l100km && <span className="text-slate-500 font-normal ml-1">({l100km} L/100km)</span>}
                    </span>
                </div>

                {/* Tailpipe CO2 Intensity */}
                <div className="flex justify-between">
                    <span>Tailpipe CO₂:</span>
                    <span className="text-amber-400 font-bold">
                        {co2Gpm > 0 ? `${co2Gpm} g/mi` : 'N/A'}
                        {gPerKm && <span className="text-amber-500/70 font-normal ml-1">({gPerKm} g/km)</span>}
                    </span>
                </div>
            </div>
        </div>
    );
}