// src/app/components/home/ledger/LedgerParametersSummary.jsx

'use client';

import React from 'react';

export default function LedgerParametersSummary({ log }) {
    if (!log) return null;

    const category = log.category_display?.toLowerCase();
    const payloadObject = typeof log.raw_payload === 'string' ? JSON.parse(log.raw_payload) : (log.raw_payload || {});
    const meta = payloadObject?.metadata || {};

    return (
        <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg text-[11px] text-slate-400 space-y-1.5 font-mono max-w-full">
            <span className="text-[9px] text-blue-500 font-bold block uppercase tracking-wider mb-1">
                Verified Audit Input Bounds
            </span>

            {category === 'vehicle' && log.input_distance && (
                <>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Vehicle Profile:</span>
                        <span className="text-blue-400 font-bold uppercase truncate max-w-[160px]">{meta.vehicleProfile || 'Fleet Asset'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Distance Run:</span>
                        <span className="text-white font-bold">{log.input_distance} {log.input_unit || 'km'}</span>
                    </div>
                </>
            )}

            {category === 'shipping' && log.cargo_weight && (
                <>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Cargo Freight:</span>
                        <span className="text-white font-bold">{log.cargo_weight} {log.mass_unit}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Transit Distance:</span>
                        <span className="text-white font-bold">{log.input_distance} {log.input_unit}</span>
                    </div>
                </>
            )}

            {category === 'flight' && (
                <>
                    <div className="flex flex-col border-b border-slate-900 pb-1 space-y-0.5">
                        <span className="text-slate-500">Flight Sector Route Path:</span>
                        <span className="text-blue-400 font-bold uppercase tracking-wide leading-tight">
                            ✈️ {meta.route_display || `${log.origin_iata} - ${log.dest_iata}`}
                        </span>
                    </div>
                    {meta.distanceKm && (
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>Spherical Distance:</span>
                            <span className="text-slate-300 font-bold">{meta.distanceKm} KM</span>
                        </div>
                    )}
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Passengers Pax:</span>
                        <span className="text-white font-bold">{log.passengers_count || meta.passengers || 1} pax</span>
                    </div>
                </>
            )}

            {category === 'electricity' && log.energy_kwh && (
                <>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Grid Electricity:</span>
                        <span className="text-white font-bold">{log.energy_kwh} kWh</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Utility Grid Region:</span>
                        <span className="text-amber-400 font-bold uppercase">{log.country_code || 'ZA'}</span>
                    </div>
                </>
            )}

            {category === 'gas' && log.gas_quantity && (
                <>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Combustion Fuel:</span>
                        <span className="text-white font-bold">{log.gas_quantity} {log.gas_unit}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Gas Profile Type:</span>
                        <span className="text-slate-300 font-bold uppercase">{log.gas_type?.replace('_', ' ')}</span>
                    </div>
                </>
            )}

            {log.category_display === 'ROUTE CHECKER' && (
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Vehicle Specs:</span>
                        <span className="text-blue-400 font-bold uppercase truncate max-w-[150px]">{meta.vehicleDescription}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Haversine Transit:</span>
                        <span className="text-white font-bold">{log.input_distance} KM</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Emissions Intensity:</span>
                        <span className="text-slate-300 font-bold">{meta.carbonMultiplierApplied} kg CO₂/km</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Projected Fuel:</span>
                        <span className="text-amber-400 font-bold">{meta.projectedFuelLitres} Litres</span>
                    </div>

                    {Array.isArray(meta.coordinatesArray) && meta.coordinatesArray.length > 0 && (
                        <div className="pt-1.5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Sequential Trace Matrix Logs:</span>
                            <div className="max-h-24 overflow-y-auto border border-slate-900 bg-slate-950/60 rounded p-1.5 space-y-1 custom-scrollbar text-[10px]">
                                {meta.coordinatesArray.map((point, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-400 font-mono">
                                        <span className="text-slate-600">WP #{idx + 1}:</span>
                                        <span className="text-slate-300 select-all">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {meta.isTaxEngineOutput && (
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Statutory Base Rate:</span>
                        <span className="text-slate-300 font-bold">R {meta.statutoryBaseRate?.toFixed(2)} / tonne</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Basic Free Allowance:</span>
                        <span className="text-blue-400 font-bold">{meta.freeBasicExemption}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Taxable Volume:</span>
                        <span className="text-white font-bold">{meta.taxableEmissionsVolumeMt?.toFixed(4)} MT</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Total Accrued Liability:</span>
                        <span className="text-emerald-400 font-black">R {meta.totalAccruedLiabilityZar?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900/60 pt-1 text-[10px] text-slate-500">
                        <span>Evaluation Logs Analysed:</span>
                        <span>{meta.recordsCompiled} entries</span>
                    </div>
                </div>
            )}
        </div>
    );
}
