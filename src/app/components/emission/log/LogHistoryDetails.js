'use client';

import React, { useState } from 'react';
import ExportModal from './ExportModal';
import LogMetricsDisplay from './LogMetricsDisplay';

export default function LogHistoryDetails({ inspectedLogNode, customVehicles, user, onTogglePrintStatus }) {
    const [isExportOpen, setIsExportOpen] = useState(false);

    if (!inspectedLogNode) {
        return (
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg min-h-[300px] flex items-center justify-center text-center text-slate-600 text-xs border-dashed font-mono">
                Select a log from the left side to see details.
            </div>
        );
    }

    const matchingAssetNode = customVehicles.find(v => v.id === inspectedLogNode.vehicle_id);
    const activePlateLabel = matchingAssetNode?.registration_number || 'N/A';
    const payloadObject = typeof inspectedLogNode.raw_payload === 'string' ? JSON.parse(inspectedLogNode.raw_payload) : (inspectedLogNode.raw_payload || {});

    const hasInputs = inspectedLogNode.input_distance || inspectedLogNode.cargo_weight || inspectedLogNode.passengers_count || inspectedLogNode.origin_iata || inspectedLogNode.energy_kwh || inspectedLogNode.gas_quantity;
    const currentCategory = (inspectedLogNode.category_display || '').toLowerCase();

    const printStatus = inspectedLogNode.print_status || 'included';

    return (
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg min-h-[300px] flex flex-col justify-between font-mono relative">
            <div className="space-y-3 text-[11px]">
                <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
                    <div>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-widest">Log Summary</span>
                        <span className="text-[10px] text-slate-400 select-all block truncate max-w-[140px]">{inspectedLogNode.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => onTogglePrintStatus && onTogglePrintStatus(inspectedLogNode.id, printStatus)}
                            className={`border text-[9px] font-bold py-1 px-2.5 rounded transition-all uppercase tracking-wider shadow-sm stims-hover-glow cursor-pointer ${printStatus === 'included'
                                ? 'border-rose-900/60 bg-rose-950/30 text-rose-400 hover:text-white'
                                : 'border-emerald-900/60 bg-emerald-950/30 text-emerald-400 hover:text-white'
                                }`}
                        >
                            {printStatus === 'included' ? '🚫 Exclude' : '✅ Include'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsExportOpen(true)}
                            className="border border-blue-900 hover:border-blue-500 bg-blue-950/40 text-blue-400 hover:text-white text-[9px] font-bold py-1 px-2.5 rounded transition-all uppercase tracking-wider shadow-sm stims-hover-glow cursor-pointer"
                        >
                            🚀 Export
                        </button>
                    </div>
                </div>

                <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="text-slate-200 font-bold uppercase">{inspectedLogNode.category_display}</span>
                    </div>

                    {/* Label changed to Print status and dots stripped entirely */}
                    <div className="flex justify-between">
                        <span>Print status:</span>
                        <span className={`font-bold uppercase tracking-wider ${printStatus === 'included' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {printStatus}
                        </span>
                    </div>

                    {matchingAssetNode && <div className="flex justify-between"><span>License Plate:</span><span className="text-blue-400 font-bold uppercase">{activePlateLabel}</span></div>}
                    <div className="flex justify-between"><span>Date:</span><span className="text-slate-300 font-bold">{new Date(inspectedLogNode.emission_date).toLocaleDateString('en-ZA')}</span></div>

                    <LogMetricsDisplay node={inspectedLogNode} />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-2 mt-2">
                    <span className="text-[9px] text-blue-500 block font-bold mb-1 uppercase tracking-wider">Input Details</span>
                    <div className="text-[9px] text-slate-400 space-y-1">
                        {hasInputs ? (
                            <>
                                {inspectedLogNode.input_distance && currentCategory !== 'flight' && (
                                    <div><strong>Distance:</strong> {inspectedLogNode.input_distance} {inspectedLogNode.input_unit || 'km'}</div>
                                )}
                                {inspectedLogNode.cargo_weight && (
                                    <div><strong>Weight:</strong> {inspectedLogNode.cargo_weight} {inspectedLogNode.mass_unit || 'kg'}</div>
                                )}
                                {inspectedLogNode.passengers_count && (
                                    <div><strong>Passengers:</strong> {inspectedLogNode.passengers_count} pax</div>
                                )}
                                {currentCategory === 'flight' && (
                                    <div><strong>Flight Route:</strong> {payloadObject?.metadata?.route_display || inspectedLogNode.origin_iata + ' - ' + inspectedLogNode.dest_iata}</div>
                                )}
                                {inspectedLogNode.energy_kwh && (
                                    <div><strong>Electricity:</strong> {inspectedLogNode.energy_kwh} kWh (Grid: {inspectedLogNode.country_code || 'ZA'})</div>
                                )}
                                {inspectedLogNode.gas_quantity && (
                                    <div><strong>Gas:</strong> {inspectedLogNode.gas_quantity} {inspectedLogNode.gas_unit || 'm3'} ({inspectedLogNode.gas_type || 'Natural Gas'})</div>
                                )}
                            </>
                        ) : (
                            <div><strong>Details:</strong> Calculated data</div>
                        )}
                    </div>
                </div>
            </div>

            {isExportOpen && (
                <ExportModal
                    user={user}
                    inspectedLogNode={inspectedLogNode}
                    customVehicles={customVehicles}
                    selectedFilterVehicleId="all"
                    onClose={() => setIsExportOpen(false)}
                />
            )}
        </div>
    );
}
