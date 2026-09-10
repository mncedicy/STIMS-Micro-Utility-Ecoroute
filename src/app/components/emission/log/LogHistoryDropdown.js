// src/app/components/emission/log/LogHistoryDropdown.js

'use client';

import React from 'react';

export default function LogHistoryDropdown({
    customVehicles = [],
    rawLogsCount = 0,
    selectedFilterVehicleId,
    onFilterChange,
    startDate,
    endDate
}) {
    const todayMaxString = new Date().toISOString().split('T')[0];

    return (
        <div className="border-b border-slate-800 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono w-full">
            {/* Title & Subtitle */}
            <div className="space-y-0.5 w-full md:max-w-xs">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">
                    Filter Logs
                </h3>
                <p className="text-[10px] text-slate-500 leading-tight">
                    Filter your carbon data by vehicles, categories, or dates.
                </p>
            </div>

            {/* Filter Controls Container */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 md:justify-end w-full md:w-auto">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                    {/* FROM Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-[10px] text-slate-500 w-full sm:w-auto">
                        <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            max={todayMaxString}
                            onChange={(e) => onFilterChange(selectedFilterVehicleId, e.target.value, endDate)}
                            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px] min-h-[36px]"
                        />
                    </div>

                    {/* TO Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-[10px] text-slate-500 w-full sm:w-auto">
                        <span className="uppercase tracking-wider text-[9px] sm:text-[10px]">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            max={todayMaxString}
                            onChange={(e) => onFilterChange(selectedFilterVehicleId, startDate, e.target.value)}
                            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px] min-h-[36px]"
                        />
                    </div>
                </div>

                {/* Dropdown Select */}
                <select
                    value={selectedFilterVehicleId}
                    onChange={(e) => onFilterChange(e.target.value, startDate, endDate)}
                    className="w-full sm:w-auto max-w-full bg-slate-950 border border-slate-800 rounded text-xs px-2.5 py-2 text-slate-300 focus:outline-none focus:border-blue-500 font-mono cursor-pointer truncate min-h-[36px]"
                >
                    <optgroup label="All Logs" className="bg-slate-900 text-slate-400">
                        <option value="all">-- All Transactions ({rawLogsCount}) --</option>
                    </optgroup>

                    <optgroup label="By Category" className="bg-slate-900 text-slate-400">
                        <option value="filter_flight">✈️ Aviation Only</option>
                        <option value="filter_shipping">🚢 Shipping Only</option>
                        <option value="filter_electricity">⚡ Electricity Only</option>
                        <option value="filter_gas">🔥 Gas Only</option>
                    </optgroup>

                    <optgroup label="By Vehicle" className="bg-slate-900 text-slate-400">
                        {customVehicles.map(v => (
                            <option key={v.id} value={v.id}>
                                [Plate: {v.registration_number || v.registration || 'N/A'}] {v.make} {v.model}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>
        </div>
    );
}
