'use client';

import React from 'react';

export default function LogHistoryDropdown({
    customVehicles,
    rawLogsCount,
    selectedFilterVehicleId,
    onFilterChange,
    startDate,
    endDate
}) {
    return (
        <div className="border-b border-slate-800 pb-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono w-full">
            {/* FIXED: Trimmed down sizing bounds to prevent vertical text pushing on small monitor displays */}
            <div className="space-y-0.5 max-w-sm">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">VEHICLE RUN HISTORY</h3>
                <p className="text-[10px] text-slate-500 leading-tight">Filter emissions records by fleet asset and calendar months.</p>
            </div>

            {/* FIXED: Symmetrical alignment columns with clean text input label tags */}
            <div className="flex flex-wrap items-center gap-3 md:justify-end flex-grow">
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider">FROM:</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onFilterChange(selectedFilterVehicleId, e.target.value, endDate)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider">TO:</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onFilterChange(selectedFilterVehicleId, startDate, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                </div>

                <select
                    value={selectedFilterVehicleId}
                    onChange={(e) => onFilterChange(e.target.value, startDate, endDate)}
                    className="bg-slate-950 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                >
                    <option value="all">-- ALL ASSETS ({rawLogsCount}) --</option>
                    {customVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                            [Plate: {v.registration_number || v.registration || 'N/A'}] {v.make}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
