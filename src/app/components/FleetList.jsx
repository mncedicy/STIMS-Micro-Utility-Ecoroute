'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FleetList({ customVehicles, onVehicleDeleted }) {
    const [deletingId, setLoadingId] = useState(null);
    const [optimisticHiddenIds, setOptimisticHiddenIds] = useState([]);

    const handleDelete = async (vehicleId, plateNumber) => {
        const confirmed = window.confirm(`Are you sure you want to deactivate vehicle [${plateNumber}]? It will be removed from your active fleet lists.`);
        if (!confirmed) return;

        setLoadingId(vehicleId);

        // OPTIMISTIC UPDATE: Hide the vehicle instantly from the UI for a fast experience
        setOptimisticHiddenIds(prev => [...prev, vehicleId]);

        try {
            // Execute the database table parameter state shift toggle securely
            const { error } = await supabase
                .from('user_vehicles')
                .update({ is_active: false })
                .eq('id', vehicleId);

            if (error) throw error;

            // Fire callback to sync parent state pools
            onVehicleDeleted();
        } catch (err) {
            // If the cloud network fails, reverse the optimistic hide and show the item again
            setOptimisticHiddenIds(prev => prev.filter(id => id !== vehicleId));
            alert(`Security Write Rejection: ${err.message || 'Check database update policies.'}`);
        } finally {
            setLoadingId(null);
        }
    };

    // Combine RLS values and filter out any optimistically hidden car asset rows
    const activeFleetOnly = customVehicles.filter(
        car => car.is_active !== false && !optimisticHiddenIds.includes(car.id)
    );

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 col-span-1 md:col-span-2">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">Active Corporate Fleet Profile Registry</h2>
                    <p className="text-[11px] text-slate-400">Review registered car assets and management tracking tags</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-bold">
                    TOTAL CORES: {activeFleetOnly.length}
                </span>
            </div>

            {activeFleetOnly && activeFleetOnly.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {activeFleetOnly.map((car) => (
                        <div
                            key={car.id}
                            className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex justify-between items-center hover:border-slate-700/60 transition-colors group animate-fade-in"
                        >
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                                    <span>🚗</span>
                                    <span>{car.make} {car.model}</span>
                                    <span className="text-[10px] text-slate-500 font-normal">({car.year})</span>
                                </div>
                                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded w-max font-bold">
                                    {car.registration_number || 'NO PLATE'}
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={deletingId === car.id}
                                onClick={() => handleDelete(car.id, car.registration_number)}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[11px] font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/50 border border-red-900/40 px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                            >
                                {deletingId === car.id ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-6 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl text-xs text-slate-500">
                    No active corporate car assets archived. Click the <strong className="text-emerald-400 font-semibold">"🚗 Add Fleet Car"</strong> button at the top to initialize profiles.
                </div>
            )}
        </div>
    );
}
