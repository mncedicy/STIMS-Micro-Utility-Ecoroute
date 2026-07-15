'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FleetList({ customVehicles, onVehicleDeleted }) {
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const executeDeleteNode = async () => {
        if (!vehicleToDelete) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('ecoroute_vehicles').update({ is_active: false }).eq('id', vehicleToDelete.id);
            if (error) throw error;
            setVehicleToDelete(null);
            onVehicleDeleted();
        } catch (err) {
            console.error('Error soft-deleting asset tracking node:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative group font-mono md:col-span-2">
            <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">ACTIVE FLEET ASSETS REGISTER</h3>
                <span className="text-[10px] text-slate-500">COUNT: {customVehicles.length}</span>
            </div>

            {customVehicles.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                        <thead>
                            <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                                <th className="py-2">REGISTRATION</th>
                                <th className="py-2">MAKE</th>
                                <th className="py-2">MODEL</th>
                                <th className="py-2">YEAR</th>
                                <th className="py-2 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                            {customVehicles.map((vehicle) => (
                                <tr key={vehicle.id} className="hover:bg-slate-950/30 transition-colors">
                                    <td className="py-2.5 font-bold text-blue-400 tracking-wider uppercase">{vehicle.registration_number || vehicle.registration || 'N/A'}</td>
                                    <td className="py-2.5 text-slate-200">{vehicle.make}</td>
                                    <td className="py-2.5 text-slate-400">{vehicle.model}</td>
                                    <td className="py-2.5 text-slate-500">{vehicle.year}</td>
                                    <td className="py-2.5 text-right">
                                        <button type="button" onClick={() => setVehicleToDelete(vehicle)} className="text-[10px] border border-rose-950/40 hover:border-rose-900 text-rose-500 bg-rose-950/10 px-2 py-0.5 rounded transition-colors">REMOVE</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">NO INSTANTIATED VEHICLE MANAGEMENT NODES CURRENTLY LINKED TO DATABASE.</div>
            )}

            {/* FIXED: Changed to items-center to secure perfect screen vertical centering */}
            {vehicleToDelete && (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
                    <div className="w-full max-w-sm p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto stims-hover-glow transition-all duration-300">
                        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">DE REGISTRATION AUDIT CONFIRMATION</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Are you sure you want to terminate fleet node tracking assets for:
                            <span className="block mt-2 font-bold text-blue-400 border-l-2 border-blue-500 pl-2 bg-slate-950/40 py-1.5 rounded-r">
                                [{vehicleToDelete.registration_number || vehicleToDelete.registration || 'N/A'}] {vehicleToDelete.make} {vehicleToDelete.model}
                            </span>
                        </p>
                        <div className="flex space-x-2 pt-2 text-[10px]">
                            <button type="button" disabled={deleting} onClick={() => setVehicleToDelete(null)} className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded text-slate-400 transition-colors uppercase tracking-wider">ABORT ACTION</button>
                            <button type="button" disabled={deleting} onClick={executeDeleteNode} className="flex-1 bg-rose-950/30 border border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white font-bold py-2 rounded transition-all uppercase tracking-wider disabled:opacity-50">{deleting ? 'DELETING...' : 'CONFIRM REMOVAL'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
