// src/app/components/fleet/asset/FleetList.jsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import DeleteVehicleModal from './DeleteVehicleModal';
import { FleetMobileCard, FleetDesktopRow } from './FleetAssetRow';

export default function FleetList({ customVehicles = [], onVehicleDeleted, isPremium }) {
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const executeDeleteNode = async () => {
        if (!vehicleToDelete) return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('ecoroute_vehicles')
                .update({ is_active: false })
                .eq('id', vehicleToDelete.id);

            if (error) throw error;
            setVehicleToDelete(null);
            if (typeof onVehicleDeleted === 'function') onVehicleDeleted();
        } catch (err) {
            console.error('Error soft-deleting tracking asset node:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-4 sm:p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-300 stims-hover-glow relative group font-mono md:col-span-2">

            {/* Header Tracker Metric Status */}
            <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between">
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
                <>
                    {/* 1. MOBILE RESPONSIVE LAYOUT */}
                    <div className="block md:hidden space-y-3">
                        {customVehicles.map((vehicle) => (
                            <FleetMobileCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onSelectDelete={setVehicleToDelete}
                            />
                        ))}
                    </div>

                    {/* 2. DESKTOP TABULAR LAYOUT */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-300">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                                    <th className="py-2.5 px-2">REGISTRATION</th>
                                    <th className="py-2.5 px-2">VEHICLE SPEC</th>
                                    <th className="py-2.5 px-2">CLASS / DRIVE</th>
                                    <th className="py-2.5 px-2">FUEL & FE</th>
                                    <th className="py-2.5 px-2">CO₂ MULTIPLIER</th>
                                    <th className="py-2.5 px-2">NODE UUID</th>
                                    <th className="py-2.5 px-2 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60">
                                {customVehicles.map((vehicle) => (
                                    <FleetDesktopRow
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        onSelectDelete={setVehicleToDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
                    NO INSTANTIATED VEHICLE MANAGEMENT NODES CURRENTLY LINKED TO DATABASE.
                </div>
            )}

            {/* Extracted System Dialog Trigger Confirmation */}
            <DeleteVehicleModal
                vehicle={vehicleToDelete}
                deleting={deleting}
                onConfirm={executeDeleteNode}
                onCancel={() => setVehicleToDelete(null)}
            />
        </div>
    );
}
