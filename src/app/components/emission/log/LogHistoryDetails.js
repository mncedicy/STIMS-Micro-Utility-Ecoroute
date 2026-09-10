// src/app/components/emission/log/LogHistoryDetails.js

'use client';

import React, { useState } from 'react';
import ExportModal from './ExportModal';
import LogMetricsDisplay from './LogMetricsDisplay';
import { generatePrintHtml } from '../../../utils/printTemplateHtml';

export default function LogHistoryDetails({ inspectedLogNode, customVehicles, user }) {
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

    const getPrintInputSummaryHtml = (log) => {
        let htmlBuffer = '';
        const cat = (log.category_display || '').toLowerCase();

        if (log.input_distance && cat !== 'flight') htmlBuffer += `<div><strong>Distance:</strong> ${log.input_distance} ${log.input_unit || 'km'}</div>`;
        if (log.cargo_weight) htmlBuffer += `<div><strong>Weight:</strong> ${log.cargo_weight} ${log.mass_unit || 'kg'}</div>`;
        if (log.passengers_count) htmlBuffer += `<div><strong>Passengers:</strong> ${log.passengers_count} pax</div>`;
        if (cat === 'flight') htmlBuffer += `<div><strong>Flight Route:</strong> ${payloadObject?.metadata?.route_display || log.origin_iata + ' - ' + log.dest_iata}</div>`;
        if (log.energy_kwh) htmlBuffer += `<div><strong>Electricity:</strong> ${log.energy_kwh} kWh (Grid: ${log.country_code || 'ZA'})</div>`;
        if (log.gas_quantity) htmlBuffer += `<div><strong>Gas:</strong> ${log.gas_quantity} ${log.gas_unit || 'm3'} (${log.gas_type || 'Natural Gas'})</div>`;
        return htmlBuffer || '<div><strong>Details:</strong> Calculated data</div>';
    };

    const handlePrintLogPdf = () => {
        const printWindowElement = document.createElement('iframe');
        printWindowElement.style.position = 'fixed';
        printWindowElement.style.width = '0';
        printWindowElement.style.height = '0';
        printWindowElement.style.border = 'none';
        document.body.appendChild(printWindowElement);

        const doc = printWindowElement.contentWindow.document;
        doc.open();
        doc.write(generatePrintHtml(inspectedLogNode, matchingAssetNode, activePlateLabel, getPrintInputSummaryHtml(inspectedLogNode)));
        doc.close();

        printWindowElement.contentWindow.focus();
        setTimeout(() => {
            printWindowElement.contentWindow.print();
            document.body.removeChild(printWindowElement);
        }, 400);
    };

    const hasInputs = inspectedLogNode.input_distance || inspectedLogNode.cargo_weight || inspectedLogNode.passengers_count || inspectedLogNode.origin_iata || inspectedLogNode.energy_kwh || inspectedLogNode.gas_quantity;
    const currentCategory = (inspectedLogNode.category_display || '').toLowerCase();

    return (
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg min-h-[300px] flex flex-col justify-between font-mono relative">
            <div className="space-y-3 text-[11px]">
                <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
                    <div>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-widest">Log Summary</span>
                        <span className="text-[10px] text-slate-400 select-all block truncate max-w-[140px]">{inspectedLogNode.id}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsExportOpen(true)}
                        className="border border-blue-900 hover:border-blue-500 bg-blue-950/40 text-blue-400 hover:text-white text-[9px] font-bold py-1 px-2.5 rounded transition-all uppercase tracking-wider shrink-0 shadow-sm stims-hover-glow cursor-pointer"
                    >
                        🚀 Export
                    </button>
                </div>

                <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between"><span>Category:</span><span className="text-slate-200 font-bold uppercase">{inspectedLogNode.category_display}</span></div>
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
