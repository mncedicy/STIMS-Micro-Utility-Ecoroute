// /src/app/components/FleetAssetTechnicalHud.jsx
'use client';

import React from 'react';

export default function FleetAssetTechnicalHud({ selectedModelData }) {
    if (!selectedModelData) return null;

    const displacementValue = selectedModelData.displacement_liters
        ? `${parseFloat(selectedModelData.displacement_liters).toFixed(1)}L`
        : 'N/A';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2 text-xs animate-fade-in font-mono text-slate-400">

            {/* Column 1 Item 1: Size Class */}
            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                <span>Classification:</span>
                <span className="text-blue-400 font-bold truncate max-w-[140px]">{selectedModelData.v_class || 'N/A'}</span>
            </div>

            {/* Column 2 Item 1: Drivetrain */}
            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                <span>Drivetrain Axle:</span>
                <span className="text-white font-bold">{selectedModelData.drive || 'N/A'}</span>
            </div>

            {/* Column 1 Item 2: Fuel Economy */}
            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                <span>FE Score:</span>
                <span className="text-emerald-400 font-bold">
                    {selectedModelData.fuel_economy_score !== -1 ? `${selectedModelData.fuel_economy_score} / 10` : 'N/A'}
                </span>
            </div>

            {/* Column 2 Item 2: Tailpipe Carbon */}
            <div className="flex justify-between border-b border-slate-900/60 pb-1">
                <span>Tailpipe CO₂:</span>
                <span className="text-amber-400 font-bold">{selectedModelData.co2_tailpipe_gpm} g/mi</span>
            </div>

            {/* Column 1 Item 3: Combined MPG */}
            <div className="flex justify-between sm:border-none border-b border-slate-900/60 pb-1 sm:pb-0">
                <span>Combined MPG:</span>
                <span className="text-white font-bold">{selectedModelData.comb_mpg_1} mi/gal</span>
            </div>

            {/* Column 2 Item 3: Displacement */}
            <div className="flex justify-between">
                <span>Engine Cap:</span>
                <span className="text-white font-bold">{displacementValue}</span>
            </div>

        </div>
    );
}