// src/app/components/fleet/history/VehicleHistoryTripList.jsx

'use client';

import React, { useState, useEffect } from 'react';

export default function VehicleHistoryTripList({ vehicleLogs = [] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 4;

    useEffect(() => {
        setCurrentPage(1);
    }, [vehicleLogs]);

    const totalPages = Math.ceil(vehicleLogs.length / recordsPerPage) || 1;
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedTrips = vehicleLogs.slice(startIndex, startIndex + recordsPerPage);

    const parsePayloadMetadata = (log) => {
        try {
            if (!log || !log.raw_payload) return {};
            if (typeof log.raw_payload === 'string') {
                return JSON.parse(log.raw_payload)?.metadata || {};
            }
            return log.raw_payload?.metadata || {};
        } catch (err) {
            console.warn('[VehicleHistoryTripList] Failed parsing telemetry packet data:', err);
            return {};
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl font-mono text-xs space-y-4 flex flex-col justify-between h-[340px] stims-hover-glow transition-all duration-300">
            <div className="flex flex-col h-full overflow-hidden">
                {/* Section Header */}
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between shrink-0 mb-3">
                    <div>
                        <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-widest">Trip Log Tracker</span>
                        <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                            Itemised Trip History List
                        </h4>
                    </div>
                </div>

                {/* Scrollable Container List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {paginatedTrips.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[140px]">
                            <p className="text-xs text-slate-600 text-center uppercase">
                                No past trips found for this vehicle.
                            </p>
                        </div>
                    ) : (
                        paginatedTrips.map((log) => {
                            const meta = parsePayloadMetadata(log);
                            const distanceVal = parseFloat(log.input_distance || meta.distanceKm || 0);
                            const fuelLiters = parseFloat(meta.fuel_litres || 0);

                            return (
                                <div key={log.id} className="p-2.5 bg-[#020617] border border-slate-900 rounded-lg text-[11px] flex items-center justify-between group hover:border-slate-800 transition-all min-h-[48px]">
                                    <div className="space-y-0.5 truncate pr-4">
                                        <p className="text-slate-300 font-bold uppercase tracking-wide">
                                            🚚 Trip Distance: {distanceVal.toFixed(1)} {log.input_unit || 'km'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 tracking-tight whitespace-nowrap">
                                            📅 {log.emission_date ? new Date(log.emission_date).toLocaleDateString('en-ZA') : 'N/A'} • Fuel Used: {fuelLiters > 0 ? `${fuelLiters.toFixed(1)}L` : 'Offline'} ({meta.fuelTypeDetected || 'Calculated'})
                                        </p>
                                    </div>

                                    <div className="text-right whitespace-nowrap shrink-0">
                                        <p className="text-blue-400 font-bold tracking-tight">
                                            +{parseFloat(log.carbon_kg || 0).toFixed(2)} KG
                                        </p>
                                        <span className="text-[9px] text-slate-600 block uppercase tracking-tighter">
                                            Channel: {(log.log_source_channel || 'WEB_INTERFACE').substring(0, 13)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Pagination controls footer widget */}
            {vehicleLogs.length > recordsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-2.5 text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
                    <div>
                        Showing <span className="text-slate-300 font-bold">{startIndex + 1}</span>-
                        <span className="text-slate-300 font-bold">{Math.min(startIndex + recordsPerPage, vehicleLogs.length)}</span> of{' '}
                        <span className="text-slate-300 font-bold">{vehicleLogs.length}</span> Logs
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={`border border-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950 transition-all ${currentPage === 1
                                ? 'opacity-40 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:border-slate-700 hover:text-white cursor-pointer stims-hover-glow'
                                }`}
                        >
                            ◀ Prev
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={`border border-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950 transition-all ${currentPage === totalPages
                                ? 'opacity-40 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:border-slate-700 hover:text-white cursor-pointer stims-hover-glow'
                                }`}
                        >
                            Next ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
