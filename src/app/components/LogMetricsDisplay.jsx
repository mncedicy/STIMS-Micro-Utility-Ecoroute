// /src/app/components/LogMetricsDisplay.jsx
'use client';

import React from 'react';

export default function LogMetricsDisplay({ node }) {
    return (
        <div className="space-y-1 pt-1 border-t border-slate-900/60 mt-1">
            <div className="flex justify-between"><span>Carbon (KG):</span><span className="text-slate-200 font-bold text-blue-400">{node.carbon_kg} kg</span></div>
            <div className="flex justify-between"><span>Carbon (Metric Tons):</span><span className="text-slate-200">{node.carbon_mt} tons</span></div>
            <div className="flex justify-between"><span>Carbon (Grams):</span><span className="text-slate-200">{node.carbon_g ? node.carbon_g.toLocaleString() : 0} g</span></div>
            <div className="flex justify-between"><span>Carbon (Pounds):</span><span className="text-slate-200">{node.carbon_lb} lbs</span></div>
        </div>
    );
}
