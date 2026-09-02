// src/app/components/fleet/asset/FleetAssetManager.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabaseClient';
import FleetAssetSelectorCascade from './FleetAssetSelectorCascade';
import FleetAssetTechnicalHud from './FleetAssetTechnicalHud';

export default function FleetManager({ user, isOpen, onClose, onVehicleAdded }) {
    const [mounted, setMounted] = useState(false);
    const [registration, setRegistration] = useState('');
    const [selectedModelData, setSelectedModelData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        if (!registration.trim() || !selectedModelData) {
            return setModalError('Complete all asset parameters and selection paths.');
        }

        setSaving(true);
        try {
            // Carbon multiplier calculation logic
            let multiplier = 0.23;
            const gpm = parseFloat(selectedModelData.co2_tailpipe_gpm || 0);
            const mpg = parseFloat(selectedModelData.comb_mpg_1 || selectedModelData.comb_mpg || 0);
            const fuelType = selectedModelData.fuel_type_1 || selectedModelData.fuel_type || 'Gasoline';

            if (gpm > 0) {
                multiplier = (gpm / 1.60934) / 1000;
            } else if (mpg > 0) {
                const isDiesel = fuelType.toLowerCase().includes('diesel');
                const kgPerGallon = isDiesel ? 10.15 : 8.89;
                multiplier = ((1 / mpg) * kgPerGallon) / 1.60934;
            }

            // Extract engine capacity string (e.g. "4.4L")
            const displRaw = selectedModelData.displacement_liters || selectedModelData.displ;
            const engineCap = displRaw && displRaw !== 'N/A'
                ? (String(displRaw).includes('L') ? displRaw : `${parseFloat(displRaw).toFixed(1)}L`)
                : 'N/A';

            const { error } = await supabase
                .from('ecoroute_vehicles')
                .insert([{
                    user_id: user.id,
                    make: selectedModelData.make,
                    model: selectedModelData.model,
                    year: parseInt(selectedModelData.year, 10),
                    registration_number: registration.toUpperCase().trim(),
                    carbon_multiplier: parseFloat(multiplier.toFixed(6)),
                    is_active: true,
                    // Extended Telemetry Fields
                    fuel_type: fuelType,
                    classification: selectedModelData.v_class || selectedModelData.class || 'Standard Vehicle',
                    drivetrain: selectedModelData.drive || 'N/A',
                    engine_capacity: engineCap,
                    transmission: selectedModelData.trany || selectedModelData.transmission || 'Standard',
                    combined_mpg: mpg > 0 ? mpg : null,
                    co2_tailpipe_gpm: gpm > 0 ? gpm : null
                }]);

            if (error) throw error;

            setRegistration('');
            setSelectedModelData(null);
            if (typeof onVehicleAdded === 'function') onVehicleAdded();
            if (typeof onClose === 'function') onClose();
        } catch (err) {
            setModalError(err.message || 'Database integration node initialization failure.');
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-start sm:items-center justify-center p-4 py-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in font-mono">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative stims-hover-glow transition-all duration-300 max-h-[95vh] overflow-y-auto my-auto flex flex-col">

                {/* Sticky Header with Opaque Background */}
                <div className="sticky top-0 bg-slate-900 z-20 px-6 pt-6 pb-3 border-b border-slate-800 flex items-center justify-between">
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

                {/* Main Scrollable Body */}
                <div className="p-6 pt-4 flex-1 space-y-4">
                    {modalError && (
                        <div className="p-3 mb-4 text-[11px] bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-md">
                            ⚠️ COMPLIANCE FAULT: {modalError}
                        </div>
                    )}

                    <form id="fleet-manager-form" onSubmit={handleFormSubmit} className="space-y-4 text-xs">
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

                        <FleetAssetSelectorCascade
                            saving={saving}
                            onSelectedModelChange={setSelectedModelData}
                        />

                        <FleetAssetTechnicalHud selectedModelData={selectedModelData} />
                    </form>
                </div>

                {/* Sticky Footer with Opaque Background */}
                <div className="sticky bottom-0 bg-slate-900 z-20 px-6 py-4 border-t border-slate-800/80 flex space-x-2">
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
                        form="fleet-manager-form"
                        disabled={saving || !selectedModelData || !registration.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors uppercase text-[11px] tracking-wider disabled:opacity-50 cursor-pointer stims-hover-glow text-center"
                    >
                        {saving ? 'INJECTING ASSET...' : 'COMMIT TO LEDGER'}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}