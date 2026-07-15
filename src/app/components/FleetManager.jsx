'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { dummyMakes, dummyModelsMap } from '../lib/mockData';

export default function FleetManager({ user, isOpen, onClose, onVehicleAdded }) {
    const [makeId, setMakeId] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [registration, setRegistration] = useState('');
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    if (!isOpen) return null;

    const handleMakeChange = (e) => {
        setMakeId(e.target.value);
        setModel('');
    };

    const handleAddAssetSubmit = async (e) => {
        e.preventDefault();
        if (!makeId || !model || !year || !registration) {
            return setModalError('Complete all registry parameters.');
        }

        setSaving(true);
        setModalError('');

        const targetMakeObject = dummyMakes.find(m => m.id === makeId);
        const vehicleMakeName = targetMakeObject ? targetMakeObject.name : makeId;

        try {
            // MODIFIED: Updated field variable key to registration_number to align with schema properties
            const { error } = await supabase
                .from('ecoroute_vehicles')
                .insert([{
                    user_id: user.id,
                    make: vehicleMakeName,
                    model: model,
                    year: Number(year),
                    registration_number: registration.toUpperCase().trim(),
                    is_active: true
                }]);

            if (error) throw error;

            setMakeId('');
            setModel('');
            setYear(new Date().getFullYear());
            setRegistration('');

            onVehicleAdded();
            onClose();
        } catch (err) {
            setModalError(err.message || 'Database integration node initialization failure.');
        } finally {
            setSaving(false);
        }
    };

    const availableModelsList = makeId ? dummyModelsMap[makeId] || [] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in font-mono">
            <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative stims-hover-glow transition-all duration-300">

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
                        className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
                    >
                        [ESC]
                    </button>
                </div>

                {modalError && (
                    <div className="p-3 mb-4 text-[11px] bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-md">
                        ⚠️ COMPLIANCE FAULT: {modalError}
                    </div>
                )}

                <form onSubmit={handleAddAssetSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">VEHICLE REGISTRATION / LICENSE PLATE</label>
                        <input
                            type="text"
                            placeholder="E.G. GP 1234 XY / STIMS ZN"
                            value={registration}
                            onChange={(e) => setRegistration(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-700 uppercase"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">VEHICLE MANUFACTURER (MAKE)</label>
                        <select
                            value={makeId}
                            onChange={handleMakeChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                            required
                        >
                            <option value="">-- SYSTEM SEARCH SPECIFICATION --</option>
                            {dummyMakes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">SPECIFIC CLASSIFICATION MODEL</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                            disabled={!makeId}
                            required
                        >
                            <option value="">-- SELECT VEHICLE MODEL LAYER --</option>
                            {availableModelsList.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">MANUFACTURING YEAR LOG</label>
                        <input
                            type="number"
                            min={1990}
                            max={new Date().getFullYear() + 1}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-slate-800/60 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 py-2 rounded transition-colors uppercase text-[11px] tracking-wider"
                        >
                            ABORT
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors uppercase text-[11px] tracking-wider disabled:opacity-50"
                        >
                            {saving ? 'INJECTING ASSET...' : 'COMMIT TO LEDGER'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
