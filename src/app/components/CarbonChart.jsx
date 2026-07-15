'use client';

import React from 'react';

export default function CarbonChart({ history = [] }) {
    // Extract and format the last 7 entries for scannable dashboard views
    const dataPoints = history.slice(-7);
    const maxCarbon = dataPoints.length > 0
        ? Math.max(...dataPoints.map(d => d.carbon_kg), 10)
        : 100;

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative font-mono md:col-span-2">
            <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">EMISSIONS ANALYTICS MATRIX</h3>
                <span className="text-[10px] text-slate-500">WINDOW: LAST 7 AUDITS</span>
            </div>

            {dataPoints.length > 0 ? (
                <div className="space-y-4">
                    {/* Chart Graphic Bars Layout */}
                    <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-950/40 border border-slate-900/60 rounded-lg">
                        {dataPoints.map((point, index) => {
                            const barHeightPercentage = Math.max(((point.carbon_kg / maxCarbon) * 100), 6);
                            const formattedDate = point.estimated_at
                                ? new Date(point.estimated_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
                                : 'LOG';

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Hover Floating Tooltip Data Asset */}
                                    <div className="absolute -top-6 bg-slate-900 border border-blue-900 text-blue-400 font-bold text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-xl">
                                        {point.carbon_kg} kg CO₂
                                    </div>

                                    {/* Dynamic Colored Vertical Data Track Bar */}
                                    <div
                                        style={{ height: `${barHeightPercentage}%` }}
                                        className="w-full max-w-[40px] bg-gradient-to-t from-blue-600/60 to-blue-500 rounded-t transition-all duration-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                    />

                                    {/* Time Axis Display Label Node */}
                                    <span className="text-[8px] text-slate-500 mt-2 truncate max-w-full tracking-tighter uppercase">
                                        {formattedDate}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                        <span>Y-AXIS MAX: {maxCarbon.toFixed(1)} KG</span>
                        <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-sm bg-blue-500" />
                            <span>CARBON PROFILE OUTPUT (KG CO₂)</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">
                    INSUFFICIENT TIMELINE RECORDS DETECTED. EXECUTE SYSTEM ASSESSMENTS TO BUILD HISTORICAL TRACKING CHANNELS.
                </div>
            )}
        </div>
    );
}
