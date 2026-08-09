// /src/app/components/LogMetricsDisplay.jsx
'use client';

import React from 'react';

export default function LogMetricsDisplay({ node }) {
    if (!node) return null;

    return (
        <div className="space-y-1.5 pt-2 border-t border-slate-900/60 mt-1 font-mono text-[11px]">
            <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wide">Carbon (KG):</span>
                <span className="text-blue-400 font-bold text-xs tabular-nums">
                    {parseFloat(node.carbon_kg || 0).toFixed(2)} kg
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wide">Carbon (Metric Tons):</span>
                <span className="text-slate-300 tabular-nums">
                    {parseFloat(node.carbon_mt || 0).toFixed(4)} tons
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wide">Carbon (Grams):</span>
                <span className="text-slate-300 tabular-nums">
                    {node.carbon_g ? Math.round(node.carbon_g).toLocaleString('en-ZA') : 0} g
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wide">Carbon (Pounds):</span>
                <span className="text-slate-300 tabular-nums">
                    {parseFloat(node.carbon_lb || 0).toFixed(2)} lbs
                </span>
            </div>
        </div>
    );
}
