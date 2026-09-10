// src/app/components/fleet/asset/FleetList.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import DeleteVehicleModal from './DeleteVehicleModal';
import FleetAssetLedgerPanel from './FleetAssetLedgerPanel';
import FleetEmptyState from './list/FleetEmptyState';
import FleetGridContainer from './list/FleetGridContainer';
import VehicleHistorySummary from '../history/VehicleHistorySummary';
import VehicleHistoryTripList from '../history/VehicleHistoryTripList';

export default function FleetList({ customVehicles = [], rawLogsArray = [], onVehicleDeleted, isPremium, user }) {
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [fetchedLogs, setFetchedLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [emissionsCacheMap, setEmissionsCacheMap] = useState({});

    // AUTO-SELECT FIRST VEHICLE: Selects the first car automatically if the list loads or changes
    useEffect(() => {
        if (customVehicles.length > 0 && !selectedVehicle) {
            setSelectedVehicle(customVehicles[0]);
        } else if (customVehicles.length === 0) {
            setSelectedVehicle(null);
        }
    }, [customVehicles]);

    const executeDeleteNode = async () => {
        if (!vehicleToDelete) return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('ecoroute_vehicles')
                .update({ is_active: false })
                .eq('id', vehicleToDelete.id);

            if (error) throw error;

            setEmissionsCacheMap(prev => {
                const updated = { ...prev };
                delete updated[vehicleToDelete.id];
                return updated;
            });

            setVehicleToDelete(null);
            setSelectedVehicle(null);
            if (typeof onVehicleDeleted === 'function') onVehicleDeleted();
        } catch (err) {
            console.error('Error soft-deleting tracking asset node:', err);
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        if (!selectedVehicle?.id) {
            setFetchedLogs([]);
            return;
        }

        const vehicleId = selectedVehicle.id;

        if (emissionsCacheMap[vehicleId]) {
            setFetchedLogs(emissionsCacheMap[vehicleId]);
            return;
        }

        async function fetchVehicleLogsFromDb() {
            setLoadingLogs(true);
            try {
                const { data, error } = await supabase
                    .from('ecoroute_emissions_logs')
                    .select('*')
                    .eq('vehicle_id', vehicleId)
                    .order('emission_date', { ascending: false });

                if (error) throw error;

                const verifiedData = data || [];

                setEmissionsCacheMap(prev => ({
                    ...prev,
                    [vehicleId]: verifiedData
                }));

                setFetchedLogs(verifiedData);
            } catch (err) {
                console.error('[FleetList DB Fetch Exception]:', err.message);
                const localFallback = rawLogsArray.filter(log => log.vehicle_id === vehicleId);
                setFetchedLogs(localFallback);
            } finally {
                setLoadingLogs(false);
            }
        }

        fetchVehicleLogsFromDb();
    }, [selectedVehicle, rawLogsArray, emissionsCacheMap]);

    return (
        <div className="space-y-6 w-full font-mono">
            {/* Top Grid Area: Proportional 50/50 Symmetrical Fleet Register Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full">

                {/* Main Interactive Table Grid Section Box */}
                <div className="p-4 sm:p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-300 relative group flex flex-col justify-between h-[400px]  stims-hover-glow transition-all duration-300">
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header Tracker Metric Counter Status Strip */}
                        <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center space-x-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">
                                    ACTIVE FLEET ASSETS REGISTER
                                </h3>
                            </div>
                            <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                                COUNT: {customVehicles.length}
                            </span>
                        </div>

                        {customVehicles.length > 0 ? (
                            <FleetGridContainer
                                customVehicles={customVehicles}
                                selectedVehicle={selectedVehicle}
                                onSelectVehicle={setSelectedVehicle}
                            />
                        ) : (
                            <FleetEmptyState />
                        )}
                    </div>
                </div>

                {/* Symmetrical Contextual Asset Technical Inspection Panel Wrapper */}
                <div className="h-[400px] flex flex-col">
                    {selectedVehicle ? (
                        <FleetAssetLedgerPanel
                            vehicle={selectedVehicle}
                            onClose={() => setSelectedVehicle(null)}
                            onSelectDelete={setVehicleToDelete}
                        />
                    ) : (
                        <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/30 h-full flex items-center justify-center text-center text-slate-600 text-[10px] leading-relaxed uppercase tracking-wider px-8">
                            Select a vehicle asset node row from the register matrix to query technical specifications ledger array.
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Grid: Live Database Sub-Panels with Smart Caching Overlays */}
            {selectedVehicle && (
                loadingLogs ? (
                    <div className="p-8 text-center text-xs text-blue-400 font-mono border border-dashed border-slate-800 rounded-xl bg-slate-950/20 animate-pulse">
                        Querying log history from database...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full animate-fade-in">
                        <VehicleHistorySummary
                            vehicle={selectedVehicle}
                            vehicleLogs={fetchedLogs}
                            user={user}                       // <-- Forward user session parameter
                            customVehicles={customVehicles}   // <-- Forward custom vehicles array list
                        />

                        <VehicleHistoryTripList
                            vehicleLogs={fetchedLogs}
                        />
                    </div>
                )
            )}

            <DeleteVehicleModal
                vehicle={vehicleToDelete}
                deleting={deleting}
                onConfirm={executeDeleteNode}
                onCancel={() => setVehicleToDelete(null)}
            />
        </div>
    );
}
