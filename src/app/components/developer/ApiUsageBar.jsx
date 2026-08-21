// src\app\components\developer\ApiUsageBar.jsx

'use client';

import React from 'react';

export default function ApiUsageBar({ tokenRecord }) {
    // Resolve live usage numbers directly from the database token payload properties
    const currentUsage = tokenRecord?.current_monthly_usage || 0;

    // FIXED: Reads the quota limit capacity strictly from your database column row record with no client-side tier logic
    const limitCap = tokenRecord?.usage_limit_cap || 100;

    // Compute exact responsive percentage for the visual bar width layout fills
    const progressWidthPercentage = Math.min(100, Math.max(0, (currentUsage / limitCap) * 100));

    // Calculate remaining request balance slots
    const requestsLeft = Math.max(0, limitCap - currentUsage);

    return (
        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-lg font-mono text-[10px] space-y-3 w-full">
            {/* Upper Telemetry Text Information Layer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-900/60 pb-2">
                <div className="space-y-0.5">
                    <span className="text-blue-500 font-bold uppercase tracking-wider block">MONTHLY VOLUMETRIC ACCESS DATA</span>
                    <span className="text-slate-500 block text-[9px]">Calculations consume allocation slots across all API and App channels uniformly.</span>
                </div>
                <div className="text-right sm:self-center shrink-0">
                    <span className="text-slate-400 font-bold text-[11px]">
                        {currentUsage.toLocaleString()} <span className="text-slate-600 font-normal">/</span> {limitCap.toLocaleString()}
                    </span>
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider mt-0.5">REQUESTS CONSUMED</span>
                </div>
            </div>

            {/* Dynamic Vector Progress Bar Track Element */}
            <div className="space-y-1">
                <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-900/60 overflow-hidden p-0.5 relative">
                    <div
                        style={{ width: `${progressWidthPercentage}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.2)] transition-all duration-500 ease-out"
                    />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 tracking-tight">
                    <span>PROGRESS: {progressWidthPercentage.toFixed(1)}%</span>
                    <span className="text-slate-400 font-bold uppercase">
                        {requestsLeft.toLocaleString()} queries remaining
                    </span>
                </div>
            </div>
        </div>
    );
}
