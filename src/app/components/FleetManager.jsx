// /src/app/components/FleetManager.jsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import FleetAssetSelectorCascade from './FleetAssetSelectorCascade';

export default function FleetManager({ user, isOpen, onClose, onVehicleAdded }) {
    const [registration, setRegistration] = useState('');
    const [selectedModelData, setSelectedModelData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    if (!isOpen) return null;

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        if (!registration.trim() || !selectedModelData) {
            return setModalError('Complete all asset parameters and selection paths.');
        }

        setSaving(true);
        try {
            let multiplier = 0.23; // Schema default fallback coefficient per kilometer

            if (parseFloat(selectedModelData.co2_tailpipe_gpm) > 0) {
                const gpm = parseFloat(selectedModelData.co2_tailpipe_gpm);
                multiplier = (gpm / 1.60934) / 1000;
            } else if (parseFloat(selectedModelData.comb_mpg_1) > 0) {
                const mpg = parseFloat(selectedModelData.comb_mpg_1);
                const isDiesel = selectedModelData.fuel_type_1?.toLowerCase().includes('diesel');
                const kgPerGallon = isDiesel ? 10.15 : 8.89;
                multiplier = ((1 / mpg) * kgPerGallon) / 1.60934;
            }

            const { error } = await supabase
                .from('ecoroute_vehicles')
                .insert([{
                    user_id: user.id,
                    make: selectedModelData.make,
                    model: selectedModelData.model,
                    year: selectedModelData.year,
                    registration_number: registration.toUpperCase().trim(),
                    carbon_multiplier: parseFloat(multiplier.toFixed(6)),
                    is_active: true
                }]);

            if (error) throw error;

            setRegistration('');
            setSelectedModelData(null);
            onVehicleAdded();
            onClose();
        } catch (err) {
            setModalError(err.message || 'Database integration node initialization failure.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in font-mono">
            <div className="w-full max-w-2xl p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative stims-hover-glow transition-all duration-300">

                <div className="border-b border-slate-800 pb-3 mb-5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-xs uppercase tracking-widest text-slate-200 font-bold">
                            INSTANTIATE FLEET TRACKER NODE
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors text-xs cursor-pointer"
                    >
                        [ESC]
                    </button>
                </div>

                {modalError && (
                    <div className="p-3 mb-4 text-[11px] bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-md">
                        ⚠️ COMPLIANCE FAULT: {modalError}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                        {/* Field 1 of 4: License Plate Text Asset */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                                VEHICLE REGISTRATION / LICENSE PLATE
                            </label>
                            <input
                                type="text"
                                placeholder="E.G. GP 1234 XY"
                                value={registration}
                                onChange={(e) => setRegistration(e.target.value)}
                                disabled={saving}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-700 uppercase"
                                required
                            />
                        </div>

                        {/* Searchable dropdown components handler stack */}
                        <FleetAssetSelectorCascade
                            saving={saving}
                            onSelectedModelChange={setSelectedModelData}
                        />
                    </div>

                    {/* Action Form Footer */}
                    <div className="flex space-x-2 pt-2 border-t border-slate-800/60 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 rounded transition-colors uppercase text-[11px] tracking-wider cursor-pointer text-center"
                        >
                            ABORT
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !selectedModelData || !registration.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors uppercase text-[11px] tracking-wider disabled:opacity-50 cursor-pointer stims-hover-glow text-center"
                        >
                            {saving ? 'INJECTING ASSET...' : 'COMMIT TO LEDGER'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
