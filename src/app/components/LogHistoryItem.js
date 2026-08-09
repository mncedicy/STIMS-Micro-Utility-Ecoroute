// /src/app/components/LogHistoryItem.jsx
'use client';

import React from 'react';

export default function LogHistoryItem({
    filteredLogs,
    customVehicles,
    inspectedLogNode,
    onSelectLog
}) {
    const resolveDynamicItemLabel = (log) => {
        const cat = (log.category_display || '').toLowerCase();
        const payloadObject = typeof log.raw_payload === 'string' ? JSON.parse(log.raw_payload) : (log.raw_payload || {});

        if (cat === 'vehicle' || log.vehicle_id) {
            const linkedCar = customVehicles.find(v => v.id === log.vehicle_id);
            return linkedCar
                ? `🚛 [${linkedCar.registration_number || 'N/A'}] ${linkedCar.make} ${linkedCar.model}`
                : `🚛 Vehicle Run Log`;
        }

        if (cat === 'flight') {
            const meta = payloadObject?.metadata || {};

            if (meta.origin_name && meta.destination_name) {
                // FIXED FORMULATION: Cleans, slices to 9 chars, and structures destination names identically to your PDF system guidelines
                const cleanOriginName = meta.origin_name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 10).trim();
                const cleanDestName = meta.destination_name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 10).trim();

                const countryCodeStart = (meta.origin_country || 'N/A').trim().toUpperCase();
                const countryCodeEnd = (meta.destination_country || 'N/A').trim().toUpperCase();

                return `✈️ Flight: ${cleanOriginName}(${countryCodeStart}) - ${cleanDestName}(${countryCodeEnd})`;
            }

            return `✈️ Flight: ${log.origin_iata || 'N/A'} - ${log.dest_iata || 'N/A'}`;
        }

        if (cat === 'shipping') {
            return `🚢 Cargo Shipping: ${log.input_distance || 0} ${log.input_unit || 'km'} [${log.cargo_weight || 0} ${log.mass_unit || 'kg'}]`;
        }
        if (cat === 'electricity') {
            return `⚡ Grid Power: ${log.energy_kwh || 0} kWh [${log.country_code || 'ZA'}]`;
        }
        if (cat === 'gas') {
            return `🔥 Gas Combustion: ${log.gas_quantity || 0} ${log.gas_unit || 'm3'}`;
        }

        return `${cat.toUpperCase()} Assessment Run`;
    };

    return (
        <div className="max-h-[300px] overflow-y-auto border border-slate-950 rounded bg-slate-950/20 divide-y divide-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent w-full font-mono">
            {filteredLogs.map((log) => {
                const displayLabel = resolveDynamicItemLabel(log);

                return (
                    <button
                        key={log.id}
                        type="button"
                        onClick={() => onSelectLog(log)}
                        className={`w-full text-left p-3 flex items-center justify-between text-xs transition-all ${inspectedLogNode?.id === log.id
                            ? 'bg-blue-600/10 border-l-2 border-blue-500'
                            : 'hover:bg-slate-950/40 border-l-2 border-transparent'
                            }`}
                    >
                        <div className="flex-grow pr-4 max-w-[280px] truncate">
                            <span className="block font-bold text-slate-300 truncate tracking-wide uppercase">
                                {displayLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                                📅 {new Date(log.emission_date).toLocaleDateString('en-ZA')}
                            </span>
                        </div>
                        <div className="text-right w-20 shrink-0">
                            <span className="font-bold text-blue-400 block">{parseFloat(log.carbon_kg || 0).toFixed(1)} KG</span>
                            <span className="text-[9px] text-slate-500 block uppercase tracking-tight">inspect ➔</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
