// src/app/components/emission/log/LogHistoryManager.js
'use client';

import React, { useState, useEffect } from 'react';
import LogHistoryDropdown from './LogHistoryDropdown';
import LogHistoryItem from './LogHistoryItem';
import LogHistoryDetails from './LogHistoryDetails';
import ExportModal from './ExportModal';
import SystemDialogModal from '../../shared/SystemDialogModal';
import { supabase } from '../../../lib/supabaseClient';
import { executeLedgerPrint } from '../../../utils/ledgerPrintHelper';
import { compileBulkTextSummary, resolveBulkCategoryDisplayLabel } from '../../../utils/ledgerSummaryHelper';

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

    const [logs, setLogs] = useState(rawLogsArray);
    const [selectedFilterVehicleId, setSelectedFilterVehicleId] = useState('all');
    const [inspectedLogNode, setInspectedLogNode] = useState(null);
    const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);

    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, logId: null, currentStatus: null });

    const [startDate, setStartDate] = useState(dateBounds.firstDay);
    const [endDate, setEndDate] = useState(dateBounds.lastDay);

    useEffect(() => {
        setLogs(rawLogsArray);
    }, [rawLogsArray]);

    const handleFilterUpdate = (vehicleId, start, end) => {
        setSelectedFilterVehicleId(vehicleId);
        setStartDate(start || dateBounds.firstDay);
        setEndDate(end || dateBounds.lastDay);
        setInspectedLogNode(null);
    };

    const filteredLogs = logs.filter(log => {
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

        const logDateString = log.emission_date;
        const activeStart = startDate && startDate.trim() !== '' ? startDate : dateBounds.firstDay;
        const activeEnd = endDate && endDate.trim() !== '' ? endDate : dateBounds.lastDay;

        if (!logDateString) return false;
        return matchesCriteria && logDateString >= activeStart && logDateString <= activeEnd;
    });

    // Intercept update to show user dialog
    const handleUpdateLogStatusRequest = (logId, currentStatus) => {
        setConfirmModal({ isOpen: true, logId, currentStatus });
    };

    // Execute state mutation after confirmation check pass
    const executeLogStatusUpdate = async () => {
        const { logId, currentStatus } = confirmModal;
        const nextStatus = currentStatus === 'excluded' ? 'included' : 'excluded';

        setConfirmModal({ isOpen: false, logId: null, currentStatus: null });

        setLogs(prev => prev.map(l => l.id === logId ? { ...l, print_status: nextStatus } : l));
        if (inspectedLogNode?.id === logId) {
            setInspectedLogNode(prev => ({ ...prev, print_status: nextStatus }));
        }

        const { data, error } = await supabase
            .from('ecoroute_emissions_logs')
            .update({ print_status: nextStatus })
            .eq('id', logId)
            .select();

        if (error || !data || data.length === 0) {
            console.error("Database update failed:", error);
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, print_status: currentStatus } : l));
            if (inspectedLogNode?.id === logId) {
                setInspectedLogNode(prev => ({ ...prev, print_status: currentStatus }));
            }
        }
    };

    const compiledBulkMockLogNode = {
        id: `BATCH_INDEX_SET_${filteredLogs.length}_NODES`,
        category_display: resolveBulkCategoryDisplayLabel(selectedFilterVehicleId),
        carbon_kg: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg || 0), 0).toFixed(2),
        carbon_mt: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_mt || 0), 0).toFixed(4),
        carbon_g: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_g || 0), 0),
        carbon_lb: filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_lb || 0), 0).toFixed(2)
    };

    const includedLogsCount = filteredLogs.filter(l => (l.print_status || 'included') === 'included').length;

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow transition-all duration-300 w-full mx-auto font-mono relative">
            <LogHistoryDropdown
                customVehicles={customVehicles}
                rawLogsCount={logs.length}
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
                            onTogglePrintStatus={handleUpdateLogStatusRequest}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 mt-2 flex gap-2">
                        {/* Hidden bulk button container element placeholder */}
                        <button
                            type="button"
                            disabled={includedLogsCount === 0}
                            onClick={() => setIsBulkExportOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider text-[11px] text-center transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                        >
                            🚀 Export Logs ({includedLogsCount})
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">
                    No logs found matching your selection filters.
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

            {/* Confirmation Dialog Component integration hooks instantiation block */}
            <SystemDialogModal
                isOpen={confirmModal.isOpen}
                status={confirmModal.currentStatus === 'excluded' ? 'green' : 'red'}
                title={confirmModal.currentStatus === 'excluded' ? 'INCLUDE RECORD?' : 'EXCLUDE RECORD?'}
                message={
                    confirmModal.currentStatus === 'excluded'
                        ? 'Are you sure you want to include this emission run log back into your printable export summaries?'
                        : 'Are you sure you want to exclude this emission run log from your upcoming ledger documents and metrics reports?'
                }
                confirmText={confirmModal.currentStatus === 'excluded' ? 'INCLUDE' : 'EXCLUDE'}
                onConfirm={executeLogStatusUpdate}
                onCancel={() => setConfirmModal({ isOpen: false, logId: null, currentStatus: null })}
            />
        </div>
    );
}
