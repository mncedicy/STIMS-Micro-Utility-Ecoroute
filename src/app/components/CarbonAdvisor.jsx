// /src/app/components/CarbonAdvisor.jsx
'use client';

import React from 'react';

export default function CarbonAdvisor({ mode, points, totalKg, avgKg, categories }) {
    const getSummaryText = () => {
        if (points.length === 0) return "No operational telemetry found.";

        if (mode === 'date') {
            const peak = [...points].sort((a, b) => b.value - a.value)[0];
            return `🚨 PEAK INTENSITY DETECTED: Operations on [${peak.label}] released ${peak.value.toFixed(1)} KG CO₂e. ${peak.value > avgKg * 1.5
                ? "This spike sits significantly above your timeline baseline. Recommend auditing truck routes or combining shipping freight manifests for this day to mitigate carbon tax exposure."
                : "Your daily emissions trend remains stable. Maintain current defensive route planning models."
                }`;
        }

        const topCat = [...categories].sort((a, b) => b.value - a.value)[0];
        if (!topCat) return "No category footprints logged.";

        let tip = `The [${topCat.label}] sector comprises the largest portion of your carbon footprint, accounting for ${topCat.value.toFixed(1)} KG CO₂e. `;
        if (topCat.label === 'VEHICLE') tip += "Focus optimizations on high-multiplier land fleet logistics by auditing tailpipe variables.";
        if (topCat.label === 'FLIGHT') tip += "Minimize short-haul aviation segments by migrating internal enterprise team collaboration channels to digital meeting alternatives.";
        if (topCat.label === 'ELECTRICITY') tip += "High grid utility loads detected. Consider scheduling high-energy industrial warehouse shifts to off-peak slots.";
        if (topCat.label === 'SHIPPING') tip += "Deep-sea cargo values detected. Re-negotiate carrier distribution rules.";
        return tip;
    };

    return (
        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg space-y-1.5 font-mono text-[10px] leading-relaxed transition-colors hover:border-slate-800">
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>AUTOMATED CARBON ADVISER ENGINE</span>
            </div>
            <p className="text-slate-400 normal-case font-sans">{getSummaryText()}</p>
            <div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500 border-t border-slate-900/60">
                <span>TOTAL VOLUME: <strong className="text-slate-300">{(totalKg / 1000).toFixed(4)} MT</strong></span>
                <span>WINDOW AVG: <strong className="text-slate-300">{avgKg.toFixed(1)} KG</strong></span>
            </div>
        </div>
    );
}
