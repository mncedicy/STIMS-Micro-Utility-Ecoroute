// /src/app/components/CarbonChart.jsx
'use client';

import React, { useState } from 'react';

// === INTERNAL HELPER SECTORS (Prevents broken multi-file path imports) ===
const fetchChronologicalDataMatrix = (logs = []) => {
    const dateMap = {};
    logs.forEach(log => {
        const dayKey = log.emission_date || (log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
        dateMap[dayKey] = (dateMap[dayKey] || 0) + parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(dateMap)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-7)
        .map(date => ({
            label: new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
            value: dateMap[date],
            rawLabel: date
        }));
};

const fetchCategoryDataMatrix = (logs = []) => {
    const typeMap = { VEHICLE: 0, FLIGHT: 0, SHIPPING: 0, ELECTRICITY: 0, GAS: 0 };
    logs.forEach(log => {
        const cat = (log.category_display || 'VEHICLE').toUpperCase();
        if (typeMap[cat] !== undefined) typeMap[cat] += parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(typeMap).map(type => ({
        label: type,
        value: typeMap[type]
    })).filter(item => item.value > 0);
};

export default function CarbonChart({ rawLogsArray = [] }) {
    const [chartMode, setChartMode] = useState('date'); // 'date' or 'type'

    // Defensively fall back to an empty array if prop lands as undefined/null
    const safeLogsList = Array.isArray(rawLogsArray) ? rawLogsArray : [];

    const chronologicalPoints = fetchChronologicalDataMatrix(safeLogsList);
    const categoryPoints = fetchCategoryDataMatrix(safeLogsList);
    const activePoints = chartMode === 'date' ? chronologicalPoints : categoryPoints;

    const totalKg = safeLogsList.reduce((acc, curr) => acc + parseFloat(curr.carbon_kg || 0), 0);
    const avgKg = activePoints.length > 0 ? totalKg / activePoints.length : 0;
    const maxVal = activePoints.length > 0 ? Math.max(...activePoints.map(p => p.value), 10) : 100;

    // Local executive analyst adviser summary function
    const getSummaryAdviceString = () => {
        if (activePoints.length === 0) return "No operational telemetry found.";

        if (chartMode === 'date') {
            const peak = [...activePoints].sort((a, b) => b.value - a.value)[0];
            if (!peak) return "Stable operational logs trail verified.";
            return `🚨 PEAK INTENSITY DETECTED: Operations on [${peak.label}] released ${peak.value.toFixed(1)} KG CO₂e. ${peak.value > avgKg * 1.5
                ? "This spike sits significantly above your timeline baseline. Recommend auditing truck routes or combining shipping freight manifests for this day to mitigate carbon tax exposure."
                : "Your daily emissions trend remains stable. Maintain current defensive route planning models."
                }`;
        }

        const topCat = [...categoryPoints].sort((a, b) => b.value - a.value)[0];
        if (!topCat) return "No category footprints logged.";

        let tip = `The [${topCat.label}] sector comprises the largest portion of your carbon footprint, accounting for ${topCat.value.toFixed(1)} KG CO₂e. `;
        if (topCat.label === 'VEHICLE') tip += "Focus optimizations on high-multiplier land fleet logistics by auditing tailpipe variables.";
        if (topCat.label === 'FLIGHT') tip += "Minimize short-haul aviation segments by migrating internal enterprise team collaboration channels to digital meeting alternatives.";
        if (topCat.label === 'ELECTRICITY') tip += "High grid utility loads detected. Consider scheduling high-energy industrial warehouse shifts to off-peak slots.";
        if (topCat.label === 'SHIPPING') tip += "Deep-sea cargo values detected. Re-negotiate carrier distribution rules.";
        return tip;
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl font-mono text-xs space-y-4 md:col-span-2 group relative transition-all duration-300 stims-hover-glow">
            <div className="border-b border-slate-900 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">EMISSIONS ANALYTICS MATRIX</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans normal-case">Interactive Scope 1 & Scope 2 footprint data visualizations.</p>
                </div>
                <div className="flex bg-slate-950/60 p-0.5 border border-slate-900 rounded-lg self-end sm:self-center">
                    <button type="button" onClick={() => setChartMode('date')} className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${chartMode === 'date' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'text-slate-500 hover:text-slate-300'}`}>By Date</button>
                    <button type="button" onClick={() => setChartMode('type')} className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${chartMode === 'type' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'text-slate-500 hover:text-slate-300'}`}>By Category</button>
                </div>
            </div>

            {safeLogsList.length > 0 && activePoints.length > 0 ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="h-40 flex items-end justify-between gap-2 pt-6 px-4 bg-[#020617]/40 border border-slate-900 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-2 py-4 opacity-[0.03]"><div className="w-full border-b border-slate-100" /><div className="w-full border-b border-slate-100" /><div className="w-full border-b border-slate-100" /></div>
                        {activePoints.map((point, idx) => {
                            const barHeight = Math.max(((point.value / maxVal) * 100), 5);
                            const mixPercent = totalKg > 0 ? (point.value / totalKg) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10">
                                    <div className="absolute -top-10 bg-slate-950 border border-blue-900 text-blue-400 font-mono text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-2xl flex flex-col items-center space-y-0.5 min-w-[90px]">
                                        <span className="text-white font-bold">{point.value.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG</span>
                                        <span className="text-slate-500 text-[8px] tracking-tight">{mixPercent.toFixed(1)}% MIX SHARES</span>
                                    </div>
                                    <div className="w-full flex justify-center items-end h-full pb-1">
                                        <div style={{ height: `${barHeight}%` }} className="w-full max-w-[32px] bg-gradient-to-t from-blue-600/40 via-blue-500/80 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]" />
                                    </div>
                                    <span className="text-[8px] text-slate-500 font-bold mt-1.5 truncate max-w-full tracking-wider uppercase text-center block h-3">{point.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 px-1 border-b border-slate-900 pb-3">
                        <span>GRID MAX CAPACITY BASING: {maxVal.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG</span>
                        <div className="flex items-center space-x-1"><span className="h-1.5 w-1.5 rounded-sm bg-blue-500" /><span>CARBON MASS VOLUME (KG CO₂e)</span></div>
                    </div>

                    {/* Integrated Carbon Advisor Data Card Layout */}
                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg space-y-1.5 font-mono text-[10px] leading-relaxed transition-colors hover:border-slate-800">
                        <div className="flex items-center space-x-1.5 text-blue-400 font-bold uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>AUTOMATED CARBON ADVISER ENGINE</span>
                        </div>
                        <p className="text-slate-400 normal-case font-sans">{getSummaryAdviceString()}</p>
                        <div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500 border-t border-slate-900/60">
                            <span>TOTAL VOLUME: <strong className="text-slate-300">{(totalKg / 1000).toFixed(4)} MT</strong></span>
                            <span>WINDOW AVG: <strong className="text-slate-300">{avgKg.toFixed(1)} KG</strong></span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-600 text-xs border border-dashed border-slate-900 rounded-xl bg-slate-950/10 max-w-full uppercase tracking-wider text-[10px]">
                    ⚡ INSUFFICIENT LOG TELEMETRY DETECTED. SUBMIT CALCULATOR ENTRIES TO HYDRATE REAL-TIME GRAPHS.
                </div>
            )}
        </div>
    );
}
