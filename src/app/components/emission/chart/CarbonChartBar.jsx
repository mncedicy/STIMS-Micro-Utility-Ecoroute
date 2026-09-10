// src/app/components/emission/chart/CarbonChartBar.jsx

'use client';

import React from 'react';

export default function CarbonChartBar({ point, maxVal, totalKg }) {
    const barHeight = Math.max(((point.value / maxVal) * 100), 5);
    const mixPercent = totalKg > 0 ? (point.value / totalKg) * 100 : 0;

    return (
        <div className="flex-1 flex flex-col items-center group relative h-full justify-end z-10">
            {/* Interactive Analytical Hover Tooltip Panel */}
            <div className="absolute -top-10 bg-slate-950 border border-blue-900 text-blue-400 font-mono text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-2xl flex flex-col items-center space-y-0.5 min-w-[90px]">
                <span className="text-white font-bold">
                    {point.value.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG
                </span>
                <span className="text-slate-500 text-[8px] tracking-tight">
                    {mixPercent.toFixed(1)}% MIX SHARES
                </span>
            </div>

            {/* Reconciled Gradient Data Bar Column */}
            <div className="w-full flex justify-center items-end h-full pb-1">
                <div
                    style={{ height: `${barHeight}%` }}
                    className="w-full max-w-[32px] bg-gradient-to-t from-blue-600/40 via-blue-500/80 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                />
            </div>

            {/* Axis Categorical Text Display Label */}
            <span className="text-[8px] text-slate-500 font-bold mt-1.5 truncate max-w-full tracking-wider uppercase text-center block h-3">
                {point.label}
            </span>
        </div>
    );
}
