'use client';

import React from 'react';

export default function LogHistoryItem({
    filteredLogs,
    customVehicles,
    inspectedLogNode,
    onSelectLog
}) {
    return (
        <div className="max-h-[300px] overflow-y-auto border border-slate-950 rounded bg-slate-950/20 divide-y divide-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent">
            {filteredLogs.map((log) => {
                const linkedCar = customVehicles.find(v => v.id === log.vehicle_id);
                const displayLabel = linkedCar
                    ? `[${linkedCar.registration_number || linkedCar.registration || 'N/A'}] ${linkedCar.make} ${linkedCar.model}`
                    : log.category_display;

                return (
                    <button
                        key={log.id}
                        type="button"
                        onClick={() => onSelectLog(log)}
                        className={`w-full text-left p-3 flex items-center justify-between text-xs transition-all ${inspectedLogNode?.id === log.id ? 'bg-blue-950/30 border-l-2 border-blue-500' : 'hover:bg-slate-950/40 border-l-2 border-transparent'}`}
                    >
                        <div className="flex-grow pr-4 max-w-[260px] truncate">
                            <span className="block font-bold text-slate-300 truncate">{displayLabel}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                                {new Date(log.created_at).toLocaleString('en-ZA')}
                            </span>
                        </div>
                        <div className="text-right w-24 shrink-0">
                            <span className="font-bold text-blue-400 block">{log.carbon_kg} KG</span>
                            <span className="text-[9px] text-slate-500 block uppercase tracking-tight">inspect ➔</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
