// src/app/components/emission/chart/CarbonChartFilters.jsx

'use client';

import React from 'react';

export default function CarbonChartFilters({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    chartMode,
    onChartModeChange,
    todayMaxString
}) {
    return (
        <div className="border-b border-slate-900 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            <div>
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">EMISSIONS ANALYTICS MATRIX</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans normal-case">Interactive Scope 1 & Scope 2 footprint data visualizations.</p>
            </div>

            {/* Embedded High-Contrast Granular Date Filter Inputs Panel */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-center bg-[#020617]/20 p-1.5 border border-slate-900 rounded-lg">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider text-[9px]">FROM:</span>
                    <input
                        type="date"
                        value={startDate}
                        max={todayMaxString}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="bg-slate-950 border border-slate-900 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[10px]"
                    />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider text-[9px]">TO:</span>
                    <input
                        type="date"
                        value={endDate}
                        max={todayMaxString}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="bg-slate-950 border border-slate-900 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[10px]"
                    />
                </div>

                {/* Chart Mode Toggle Switches */}
                <div className="flex bg-slate-950 p-0.5 border border-slate-900 rounded-md shrink-0">
                    <button
                        type="button"
                        onClick={() => onChartModeChange('date')}
                        className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${chartMode === 'date' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        By Date
                    </button>
                    <button
                        type="button"
                        onClick={() => onChartModeChange('type')}
                        className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${chartMode === 'type' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        By Category
                    </button>
                </div>
            </div>
        </div>
    );
}
