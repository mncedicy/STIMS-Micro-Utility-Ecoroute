// src/app/components/emission/chart/CarbonAdvisorCard.jsx

'use client';

import React from 'react';

export default function CarbonAdvisorCard({ adviceString, totalKg, avgKg }) {
    return (
        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg space-y-1.5 font-mono text-[10px] leading-relaxed transition-colors hover:border-slate-800">
            {/* Adviser Engine Animated Header Block */}
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>AUTOMATED CARBON ADVISER ENGINE</span>
            </div>

            {/* Real-Time Strategic Optimization Advice Text */}
            <p className="text-slate-400 normal-case font-sans">
                {adviceString}
            </p>

            {/* Executive Summary Analytics Footnote Data Counters */}
            <div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500 border-t border-slate-900/60">
                <span>TOTAL VOLUME: <strong className="text-slate-300">{(totalKg / 1000).toFixed(4)} MT</strong></span>
                <span>WINDOW AVG: <strong className="text-slate-300">{avgKg.toFixed(1)} KG</strong></span>
            </div>
        </div>
    );
}
