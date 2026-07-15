'use client';

import React, { useState } from 'react';
import ExportModal from './ExportModal';

export default function LogHistoryDetails({ inspectedLogNode, customVehicles, user }) {
    const [isExportOpen, setIsExportOpen] = useState(false);

    const matchingAssetNode = customVehicles.find(v => v.id === inspectedLogNode?.vehicle_id);
    const activePlateLabel = matchingAssetNode?.registration_number || matchingAssetNode?.registration || 'N/A';

    // HELPER: Safely extracts operational parameters into readable text labels
    const getPayloadInputSummary = (log) => {
        const raw = log?.raw_payload || {};
        let text = '';

        if (raw.distance_value) {
            text += `<div><strong>DISTANCE COVERED:</strong> ${raw.distance_value} ${raw.distance_unit || 'mi'}</div>`;
        }
        if (raw.weight_value) {
            text += `<div><strong>CARGO WEIGHT:</strong> ${raw.weight_value} ${raw.weight_unit || 'kg'}</div>`;
        }
        if (raw.passengers) {
            text += `<div><strong>PASSENGER COUNT:</strong> ${raw.passengers} pax</div>`;
        }
        if (raw.legs && raw.legs[0]) {
            text += `<div><strong>FLIGHT ROUTE:</strong> ${raw.legs[0].departure_airport} ➔ ${raw.legs[0].destination_airport}</div>`;
        }
        return text || '<div><strong>INPUT DETAILS:</strong> Manual system lookup data</div>';
    };

    const handlePrintLogPdf = () => {
        if (!inspectedLogNode) return;

        const printWindowElement = document.createElement('iframe');
        printWindowElement.style.position = 'fixed';
        printWindowElement.style.right = '0';
        printWindowElement.style.bottom = '0';
        printWindowElement.style.width = '0';
        printWindowElement.style.height = '0';
        printWindowElement.style.border = 'none';

        document.body.appendChild(printWindowElement);

        const doc = printWindowElement.contentWindow.document;
        doc.open();
        doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EcoRoute Carbon Audit Receipt</title>
        <style>
          body { font-family: ui-mono, monospace, sans-serif; color: #0f172a; background: #ffffff; padding: 40px; font-size: 13px; line-height: 1.6; }
          .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 24px; border-radius: 8px; }
          .section-title { font-size: 11px; font-weight: bold; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .label { color: #64748b; font-size: 10px; text-transform: uppercase; }
          .value { font-weight: bold; color: #0f172a; font-size: 14px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 10px; margin-bottom: 30px; }
          .metric-card { text-align: center; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; background: #f8fafc; }
          .metric-num { font-size: 26px; font-weight: bold; color: #2563eb; margin-bottom: 4px; }
          .metric-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
          .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">STIMS ECO ROUTE AUDIT</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div>AUDIT DATE: ${new Date(inspectedLogNode.created_at).toLocaleDateString('en-ZA')}</div>
            <div>RECORD TIME: ${new Date(inspectedLogNode.created_at).toLocaleTimeString('en-ZA')}</div>
          </div>
        </div>
        
        <div class="meta-box">
          <div class="section-title">LOGISTICS TRANSACTION SIGNATURE</div>
          <div class="grid">
            <div><span class="label">RECORD ID:</span> <div class="value">${inspectedLogNode.id}</div></div>
            <div><span class="label">ROUTE ASSESSMENT CLASS:</span> <div class="value">${inspectedLogNode.category_display}</div></div>
          </div>
        </div>

        {/* MODIFIED INJECTED NODE: Prints dynamic operational parameters clearly within the PDF wrapper boxes */}
        <div class="meta-box">
          <div class="section-title">CALCULATION SOURCE RUN INPUTS</div>
          <div class="grid" style="font-size: 12px; color: #334155;">
            ${getPayloadInputSummary(inspectedLogNode)}
          </div>
        </div>

        ${matchingAssetNode ? `
        <div class="meta-box">
          <div class="section-title">ASSIGNED FLEET ASSET DESCRIPTORS</div>
          <div class="grid">
            <div><span class="label">REGISTRATION:</span> <div class="value" style="color: #2563eb;">${activePlateLabel}</div></div>
            <div><span class="label">MANUFACTURER:</span> <div class="value">${matchingAssetNode.make} ${matchingAssetNode.model}</div></div>
          </div>
        </div>
        ` : ''}
        
        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-num">${inspectedLogNode.carbon_kg}</div><div class="metric-label">Kilograms (KG)</div></div>
          <div class="metric-card"><div class="metric-num">${inspectedLogNode.carbon_mt}</div><div class="metric-label">Metric Tons</div></div>
          <div class="metric-card"><div class="metric-num">${inspectedLogNode.carbon_g.toLocaleString()}</div><div class="metric-label">Grams (G)</div></div>
          <div class="metric-card"><div class="metric-num">${inspectedLogNode.carbon_lb}</div><div class="metric-label">Pounds (Lbs)</div></div>
        </div>
        <div class="footer">STIMS Infrastructure Ecosystem Node.</div>
      </body>
      </html>
    `);
        doc.close();

        printWindowElement.contentWindow.focus();
        setTimeout(() => {
            printWindowElement.contentWindow.print();
            document.body.removeChild(printWindowElement);
        }, 400);
    };

    if (!inspectedLogNode) {
        return (
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg min-h-[300px] flex items-center justify-center text-center text-slate-600 text-xs border-dashed font-mono">
                Select an input log node from the left panel to compile packet inspection arrays.
            </div>
        );
    }

    return (
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg min-h-[300px] flex flex-col justify-between font-mono relative">
            <div className="space-y-3 text-[11px]">
                <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
                    <div>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-widest">PACKET RECOVERY TRACKER</span>
                        <span className="text-[10px] font-mono text-slate-400 select-all block truncate max-w-[140px]">{inspectedLogNode.id}</span>
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
                    <div className="flex justify-between"><span>Audit Class:</span><span className="text-slate-200 font-bold">{inspectedLogNode.category_display}</span></div>
                    {matchingAssetNode && (
                        <div className="flex justify-between"><span>Vehicle Registration:</span><span className="text-blue-400 font-bold uppercase">{activePlateLabel}</span></div>
                    )}
                    <div className="flex justify-between"><span>Log Timestamp:</span><span className="text-slate-300">{new Date(inspectedLogNode.created_at).toLocaleString('en-ZA')}</span></div>
                    <div className="flex justify-between"><span>Carbon (KG):</span><span className="text-slate-200 font-bold text-blue-400">{inspectedLogNode.carbon_kg} kg</span></div>
                    <div className="flex justify-between"><span>Carbon (Metric Tons):</span><span className="text-slate-200">{inspectedLogNode.carbon_mt} tons</span></div>
                    <div className="flex justify-between"><span>Carbon (Grams):</span><span className="text-slate-200">{inspectedLogNode.carbon_g.toLocaleString()} g</span></div>
                    <div className="flex justify-between"><span>Carbon (Pounds):</span><span className="text-slate-200">{inspectedLogNode.carbon_lb} lbs</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded p-2 mt-2">
                    <span className="text-[9px] text-blue-500 block font-bold mb-1 uppercase tracking-wider">RAW JSON PAYLOAD METRICS</span>
                    <pre className="text-[8px] text-slate-500 max-h-[100px] overflow-y-auto whitespace-pre-wrap select-all font-mono scrollbar-thin scrollbar-thumb-slate-800 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800">{JSON.stringify(inspectedLogNode.raw_payload, null, 2)}</pre>
                </div>
            </div>

            {isExportOpen && (
                <ExportModal
                    user={user}
                    inspectedLogNode={inspectedLogNode}
                    customVehicles={customVehicles}
                    onGeneratePdf={handlePrintLogPdf}
                    onClose={() => setIsExportOpen(false)}
                />
            )}
        </div>
    );
}
