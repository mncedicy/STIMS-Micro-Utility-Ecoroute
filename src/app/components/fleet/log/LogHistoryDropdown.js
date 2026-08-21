// src\app\components\fleet\log\LogHistoryDropdown.js

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
    // FIXED SAFETY GUARD: Capture today's calendar string to enforce an upper filter selection boundary limit
    const todayMaxString = new Date().toISOString().split('T')[0];

    return (
        <div className="border-b border-slate-800 pb-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono w-full">
            <div className="space-y-0.5 max-w-sm">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">LOGISTICS RUN HISTORY</h3>
                <p className="text-[10px] text-slate-500 leading-tight">Filter emissions records by fleet assets, travel category branches, or calendar windows.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end flex-grow">
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider">FROM:</span>
                    <input
                        type="date"
                        value={startDate}
                        max={todayMaxString} // FIXED: Injected strict calendar limits
                        onChange={(e) => onFilterChange(selectedFilterVehicleId, e.target.value, endDate)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                    <span className="uppercase tracking-wider">TO:</span>
                    <input
                        type="date"
                        value={endDate}
                        max={todayMaxString} // FIXED: Injected strict calendar limits
                        onChange={(e) => onFilterChange(selectedFilterVehicleId, startDate, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                </div>

                <select
                    value={selectedFilterVehicleId}
                    onChange={(e) => onFilterChange(e.target.value, startDate, endDate)}
                    className="bg-slate-950 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
                >
                    <optgroup label="CONSOLIDATED LOGS" className="bg-slate-900 text-slate-400">
                        <option value="all">-- ALL RECORDED TRANSACTIONS ({rawLogsCount}) --</option>
                    </optgroup>

                    <optgroup label="SEGMENT BRANCH FILTER INDEX" className="bg-slate-900 text-slate-400">
                        <option value="filter_flight">✈️ AVIATION FLIGHT SECTORS ONLY</option>
                        <option value="filter_shipping">🚢 CARGO OCEAN SHIPPING ONLY</option>
                        <option value="filter_electricity">⚡ GRID POWER UTILITIES ONLY</option>
                        <option value="filter_gas">🔥 GAS COMBUSTION ACCOUNTS ONLY</option>
                    </optgroup>

                    <optgroup label="INDIVIDUAL REGISTERED TRUCKS / VEHICLES" className="bg-slate-900 text-slate-400">
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
