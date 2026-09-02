// src/app/components/fleet/asset/FleetAssetList.jsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import DeleteVehicleModal from './DeleteVehicleModal';

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
            {/* Header / Tracker Counter */}
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
                    {/* ------------------------------------------------------------------ */}
                    {/* 1. MOBILE LAYOUT: Card-based view with complete UUID visibility   */}
                    {/* ------------------------------------------------------------------ */}
                    <div className="block md:hidden space-y-3">
                        {customVehicles.map((vehicle) => {
                            const l100km = vehicle.combined_mpg ? (235.215 / parseFloat(vehicle.combined_mpg)).toFixed(1) : null;
                            const gPerKm = vehicle.co2_tailpipe_gpm ? Math.round(parseFloat(vehicle.co2_tailpipe_gpm) / 1.60934) : null;

                            return (
                                <div key={vehicle.id} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2.5 text-xs relative">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start border-b border-slate-800/60 pb-2">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-slate-100 text-sm tracking-wider uppercase">
                                                    {vehicle.registration_number || 'UNREGISTERED'}
                                                </span>
                                                {vehicle.fuel_type && (
                                                    <span className="text-[9px] bg-blue-950/80 text-blue-400 border border-blue-800/40 px-1.5 py-0.2 rounded font-bold uppercase">
                                                        {vehicle.fuel_type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                                {vehicle.year} {vehicle.make} {vehicle.model}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVehicleToDelete(vehicle)}
                                            className="text-[10px] border border-rose-950/60 text-rose-500 bg-rose-950/20 px-2.5 py-1 rounded cursor-pointer stims-hover-glow-danger"
                                        >
                                            REMOVE
                                        </button>
                                    </div>

                                    {/* Detailed Telemetry Specs */}
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                        <div className="flex justify-between border-b border-slate-900 pb-0.5">
                                            <span className="text-slate-500">Class:</span>
                                            <span className="text-slate-300 truncate max-w-[90px]">{vehicle.classification || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-900 pb-0.5">
                                            <span className="text-slate-500">Drive:</span>
                                            <span className="text-slate-300 truncate max-w-[90px]">{vehicle.drivetrain || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-900 pb-0.5">
                                            <span className="text-slate-500">Engine/Trans:</span>
                                            <span className="text-slate-300">{vehicle.engine_capacity || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-900 pb-0.5">
                                            <span className="text-slate-500">Carbon Coeff:</span>
                                            <span className="text-emerald-400 font-bold">{vehicle.carbon_multiplier ? `${parseFloat(vehicle.carbon_multiplier).toFixed(6)} kg/km` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Combined FE:</span>
                                            <span className="text-slate-200">{vehicle.combined_mpg ? `${vehicle.combined_mpg} MPG` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Tailpipe CO₂:</span>
                                            <span className="text-amber-400">{vehicle.co2_tailpipe_gpm ? `${vehicle.co2_tailpipe_gpm} g/mi` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Fully Visible UUID */}
                                    <div className="pt-2 border-t border-slate-900/80 space-y-1">
                                        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider block">VEHICLE UUID (NODE_ID)</span>
                                        <div className="select-all font-mono text-[10px] text-blue-400 bg-slate-900/80 border border-slate-800/80 px-2 py-1 rounded break-all">
                                            {vehicle.id}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ------------------------------------------------------------------ */}
                    {/* 2. DESKTOP LAYOUT: Full Table with fully visible UUID column        */}
                    {/* ------------------------------------------------------------------ */}
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
                                {customVehicles.map((vehicle) => {
                                    const l100km = vehicle.combined_mpg ? (235.215 / parseFloat(vehicle.combined_mpg)).toFixed(1) : null;
                                    const gPerKm = vehicle.co2_tailpipe_gpm ? Math.round(parseFloat(vehicle.co2_tailpipe_gpm) / 1.60934) : null;

                                    return (
                                        <tr key={vehicle.id} className="hover:bg-slate-950/50 transition-colors">
                                            {/* Registration */}
                                            <td className="py-3 px-2 font-bold text-slate-100 tracking-wider uppercase text-xs">
                                                {vehicle.registration_number || 'N/A'}
                                            </td>

                                            {/* Year / Make / Model / Engine */}
                                            <td className="py-3 px-2">
                                                <div className="font-bold text-slate-200">
                                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                    Engine: {vehicle.engine_capacity || 'N/A'} • {vehicle.transmission || 'Standard'}
                                                </div>
                                            </td>

                                            {/* Classification & Drivetrain */}
                                            <td className="py-3 px-2">
                                                <div className="text-slate-300">{vehicle.classification || 'Standard'}</div>
                                                <div className="text-[10px] text-slate-500">{vehicle.drivetrain || 'N/A'}</div>
                                            </td>

                                            {/* Fuel & Fuel Economy */}
                                            <td className="py-3 px-2">
                                                <div className="text-blue-400 font-bold text-[10px] uppercase">
                                                    {vehicle.fuel_type || 'Gasoline'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {vehicle.combined_mpg ? `${vehicle.combined_mpg} MPG` : 'N/A'}
                                                    {l100km && <span className="text-slate-500 ml-1">({l100km} L/100km)</span>}
                                                </div>
                                            </td>

                                            {/* Carbon Multiplier & Tailpipe Emissions */}
                                            <td className="py-3 px-2">
                                                <div className="text-emerald-400 font-bold">
                                                    {vehicle.carbon_multiplier ? `${parseFloat(vehicle.carbon_multiplier).toFixed(6)} kg/km` : 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-amber-500/80">
                                                    {vehicle.co2_tailpipe_gpm ? `${vehicle.co2_tailpipe_gpm} g/mi` : 'N/A'}
                                                    {gPerKm && <span className="text-slate-500 ml-1">({gPerKm} g/km)</span>}
                                                </div>
                                            </td>

                                            {/* Fully Visible Node UUID */}
                                            <td className="py-3 px-2 font-mono text-[10px] text-blue-400 select-all whitespace-nowrap">
                                                {vehicle.id}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setVehicleToDelete(vehicle)}
                                                    className="text-[10px] border border-rose-950/40 text-rose-500 bg-rose-950/10 px-2.5 py-1 rounded cursor-pointer stims-hover-glow-danger"
                                                >
                                                    REMOVE
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
                    NO INSTANTIATED VEHICLE MANAGEMENT NODES CURRENTLY LINKED TO DATABASE.
                </div>
            )}

            {/* Extracted Modal Confirmation Dialog Component */}
            <DeleteVehicleModal
                vehicle={vehicleToDelete}
                deleting={deleting}
                onConfirm={executeDeleteNode}
                onCancel={() => setVehicleToDelete(null)}
            />
        </div>
    );
}