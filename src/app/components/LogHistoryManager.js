'use client';

import React, { useState } from 'react';
import LogHistoryDropdown from './LogHistoryDropdown';
import LogHistoryItem from './LogHistoryItem';
import LogHistoryDetails from './LogHistoryDetails';
import ExportModal from './ExportModal';

export default function LogHistoryManager({ user, customVehicles = [], rawLogsArray = [] }) {
    const getInitialDates = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const lastDayNode = new Date(year, today.getMonth() + 1, 0).getDate();

        return {
            firstDay: `${year}-${month}-01`,
            lastDay: `${year}-${month}-${String(lastDayNode).padStart(2, '0')}`
        };
    };

    const dateBounds = getInitialDates();

    const [selectedFilterVehicleId, setSelectedFilterVehicleId] = useState('all');
    const [inspectedLogNode, setInspectedLogNode] = useState(null);
    const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);

    const [startDate, setStartDate] = useState(dateBounds.firstDay);
    const [endDate, setEndDate] = useState(dateBounds.lastDay);

    const handleFilterUpdate = (vehicleId, start, end) => {
        setSelectedFilterVehicleId(vehicleId);
        setStartDate(start);
        setEndDate(end);
        setInspectedLogNode(null);
    };

    const filteredLogs = rawLogsArray.filter(log => {
        const matchesVehicle = selectedFilterVehicleId === 'all' || log.vehicle_id === selectedFilterVehicleId;
        const logDateString = new Date(log.created_at).toISOString().split('T')[0];
        return matchesVehicle && logDateString >= startDate && logDateString <= endDate;
    });

    const handlePrintAllLogsPdf = () => {
        if (filteredLogs.length === 0) return;

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

        const activeCarNode = customVehicles.find(v => v.id === selectedFilterVehicleId);
        const filterContextLabel = activeCarNode
            ? `ASSET: [${activeCarNode.registration_number || activeCarNode.registration || 'N/A'}] ${activeCarNode.make} ${activeCarNode.model}`
            : 'ALL ACTIVE FLEET ASSETS';

        doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EcoRoute Bulk Carbon History Ledger</title>
        <style>
          body { font-family: ui-mono, monospace, sans-serif; color: #0f172a; background: #ffffff; padding: 40px; font-size: 12px; line-height: 1.5; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 30px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
          .context-bar { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; font-weight: bold; border-radius: 6px; margin-bottom: 24px; text-transform: uppercase; color: #1e40af; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { border-bottom: 2px solid #0f172a; text-align: left; padding: 8px; font-size: 10px; color: #475569; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; font-size: 11px; }
          .total-box { margin-top: 30px; background: #f1f5f9; padding: 16px; border-radius: 6px; text-align: right; font-size: 14px; font-weight: bold; }
          .footer { margin-top: 60px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">EcoRoute Carbon History Audit Ledger</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">DATE RANGE: ${new Date(startDate).toLocaleDateString('en-ZA')} TO ${new Date(endDate).toLocaleDateString('en-ZA')}</div>
        </div>
        <div class="context-bar">${filterContextLabel}</div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Assessment Description Profile</th>
              <th style="text-align: right;">Carbon Profile Output</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs.map(log => `
              <tr>
                <td>${new Date(log.created_at).toLocaleString('en-ZA')}</td>
                <td>${log.category_display}</td>
                <td style="text-align: right; font-weight: bold; color: #2563eb;">${log.carbon_kg} KG</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-box">
          AGGREGATED CARBON MASS SUM: ${filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg), 0).toFixed(2)} KG CO₂
        </div>
        <div class="footer">Automated secure bulk log output from ecoroute.stims.co.za.</div>
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

    const getBulkTextSummary = () => {
        const activeCarNode = customVehicles.find(v => v.id === selectedFilterVehicleId);
        const filterContextLabel = activeCarNode
            ? `[${activeCarNode.registration_number || activeCarNode.registration || 'N/A'}] ${activeCarNode.make} ${activeCarNode.model}`
            : 'ALL ACTIVE FLEET CLUSTERS';

        let textBuffer = `
========================================================================
               STIMS ECOROUTE BULK DATA AUDIT LEDGER                    
========================================================================
FILTER CRITERIA:   ${filterContextLabel.toUpperCase()}
DATE RANGE WINDOW: ${startDate} TO ${endDate}
TOTAL ENTRIES LOG: ${filteredLogs.length}
TIMESTAMP RUN:     ${new Date().toLocaleString('en-ZA')}

HISTORICAL AUDIT MATRIX RUN ENTRIES:
------------------------------------------------------------------------
    `.trim() + '\n';

        filteredLogs.forEach((log, index) => {
            textBuffer += `${index + 1}. [${new Date(log.created_at).toLocaleString('en-ZA')}] ${log.category_display} -> ${log.carbon_kg} kg\n`;
        });

        textBuffer += `
------------------------------------------------------------------------
AGGREGATED CARBON MASS SUM: ${filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg), 0).toFixed(2)} KG CO₂
========================================================================
This document is a certified transaction ledger batch from ecoroute.stims.co.za.
    `.trim();

        return textBuffer;
    };

    const compiledBulkMockLogNode = {
        id: `BATCH_INDEX_SET_${filteredLogs.length}_NODES`,
        category_display: selectedFilterVehicleId === 'all' ? 'All Vehicles Consolidated Summary Ledger' : 'Isolated Fleet Asset Run Audit History Ledger',
        carbon_kg: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg), 0).toFixed(2),
        carbon_mt: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_mt), 0).toFixed(4),
        carbon_g: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_g), 0),
        carbon_lb: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_lb), 0).toFixed(2)
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow transition-all duration-300 w-full mx-auto font-mono relative">
            <LogHistoryDropdown
                customVehicles={customVehicles}
                rawLogsCount={rawLogsArray.length}
                selectedFilterVehicleId={selectedFilterVehicleId}
                startDate={startDate}
                endDate={endDate}
                onFilterChange={handleFilterUpdate}
            />

            {filteredLogs.length > 0 ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <LogHistoryItem
                            filteredLogs={filteredLogs}
                            customVehicles={customVehicles}
                            inspectedLogNode={inspectedLogNode}
                            onSelectLog={setInspectedLogNode}
                        />
                        <LogHistoryDetails
                            inspectedLogNode={inspectedLogNode}
                            customVehicles={customVehicles}
                            user={user}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsBulkExportOpen(true)}
                            className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider text-[11px] text-center transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                        >
                            🚀 Export All Filtered Logs ({filteredLogs.length} Records)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">
                    No log metrics found matching selection indices within this date range.
                </div>
            )}

            {isBulkExportOpen && (
                <ExportModal
                    user={user}
                    inspectedLogNode={compiledBulkMockLogNode}
                    customVehicles={customVehicles}
                    onClose={() => setIsBulkExportOpen(false)}
                    onGeneratePdf={handlePrintAllLogsPdf}
                    customBulkTextOverride={getBulkTextSummary()}
                />
            )}
        </div>
    );
}
