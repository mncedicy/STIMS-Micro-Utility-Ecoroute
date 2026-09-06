// src\app\components\fleet\log\LogHistoryManager.js

'use client';

import React, { useState } from 'react';
import LogHistoryDropdown from './LogHistoryDropdown';
import LogHistoryItem from './LogHistoryItem';
import LogHistoryDetails from './LogHistoryDetails';
import ExportModal from './ExportModal';
import { executeLedgerPrint } from '../../../utils/ledgerPrintHelper';
import { compileBulkTextSummary, resolveBulkCategoryDisplayLabel } from '../../../utils/ledgerSummaryHelper';

export default function LogHistoryManager({ user, customVehicles = [], rawLogsArray = [] }) {
    // Strict date boundary generator to enforce clean calendar limits
    const getInitialDates = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');

        // Calculate the absolute last day of the current calendar month safely
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

    // Initialize state strictly to the current calendar month bounds (e.g. 2026-08-01 to 2026-08-31)
    const [startDate, setStartDate] = useState(dateBounds.firstDay);
    const [endDate, setEndDate] = useState(dateBounds.lastDay);

    const handleFilterUpdate = (vehicleId, start, end) => {
        setSelectedFilterVehicleId(vehicleId);
        setStartDate(start || dateBounds.firstDay);
        setEndDate(end || dateBounds.lastDay);
        setInspectedLogNode(null);
    };

    const filteredLogs = rawLogsArray.filter(log => {
        // 1. Evaluate individual tracking category matches
        let matchesCriteria = false;
        const cat = (log.category_display || '').toLowerCase();

        if (selectedFilterVehicleId === 'all') {
            matchesCriteria = true;
        } else if (selectedFilterVehicleId === 'filter_flight') {
            matchesCriteria = cat === 'flight';
        } else if (selectedFilterVehicleId === 'filter_shipping') {
            matchesCriteria = cat === 'shipping';
        } else if (selectedFilterVehicleId === 'filter_electricity') {
            matchesCriteria = cat === 'electricity';
        } else if (selectedFilterVehicleId === 'filter_gas') {
            matchesCriteria = cat === 'gas';
        } else {
            matchesCriteria = log.vehicle_id === selectedFilterVehicleId;
        }

        // 2. STAGE ACCURATE DATE COMPARISON BOUNDS
        const logDateString = log.emission_date;

        // FIXED FORCED BOUNDS: Fall back cleanly to the static current month parameters if string fields land empty
        const activeStart = startDate && startDate.trim() !== '' ? startDate : dateBounds.firstDay;
        const activeEnd = endDate && endDate.trim() !== '' ? endDate : dateBounds.lastDay;

        // Absolute validation check: Verify the date exists and falls cleanly within limits
        if (!logDateString) return false;

        const isWithinDateRange = logDateString >= activeStart && logDateString <= activeEnd;

        return matchesCriteria && isWithinDateRange;
    });

    const compiledBulkMockLogNode = {
        id: `BATCH_INDEX_SET_${filteredLogs.length}_NODES`,
        category_display: resolveBulkCategoryDisplayLabel(selectedFilterVehicleId),
        carbon_kg: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg || 0), 0).toFixed(2),
        carbon_mt: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_mt || 0), 0).toFixed(4),
        carbon_g: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_g || 0), 0),
        carbon_lb: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_lb || 0), 0).toFixed(2)
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
                    onGeneratePdf={() => executeLedgerPrint(startDate, endDate, selectedFilterVehicleId, customVehicles, filteredLogs)}
                    customBulkTextOverride={compileBulkTextSummary(startDate, endDate, selectedFilterVehicleId, customVehicles, filteredLogs)}
                    startDate={startDate}
                    endDate={endDate}
                    selectedFilterVehicleId={selectedFilterVehicleId}
                />
            )}
        </div>
    );
}
