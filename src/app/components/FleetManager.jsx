// src/app/components/FleetManager.jsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FleetManager({ user, isOpen, onClose, onVehicleAdded }) {
    const localCatalog = [
        { id: "toyota-01", name: "Toyota", models: ["Hilux Bakkie", "Corolla", "Quantum Van", "Fortuner"] },
        { id: "ford-02", name: "Ford", models: ["Ranger Bakkie", "Transit Custom", "Everest"] },
        { id: "isuzu-03", name: "Isuzu", models: ["D-Max Bakkie", "N-Series Truck"] },
        { id: "vw-04", name: "Volkswagen", models: ["Caddy Cargo", "Crafter Van", "Polo Vivo"] }
    ];

    const [selectedMake, setSelectedMake] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [regNumber, setRegNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

    const currentYear = new Date().getFullYear();
    const maxYearRange = currentYear + 1;
    const yearsRange = [];
    for (let y = maxYearRange; y >= 1990; y--) yearsRange.push(y);

    useEffect(() => {
        if (!selectedMake) {
            setAvailableModels([]);
            setSelectedModel('');
            return;
        }
        const matchedBrand = localCatalog.find(b => b.name === selectedMake);
        setAvailableModels(matchedBrand ? matchedBrand.models : []);
        setSelectedModel('');
    }, [selectedMake]);

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        if (!selectedMake || !selectedModel || !regNumber || !user?.id) return;

        setLoading(true);
        setAlertMsg({ type: '', text: '' });
        const cleanRegNumber = regNumber.trim().toUpperCase();

        try {
            // SAFE-GUARD CHECK: Ensure a master profile record exists before adding the vehicle
            const { data: profileCheck } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profileCheck) {
                // Instantly generate the profile link to heal the foreign key link on the fly
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        first_name: user.user_metadata?.first_name || user.user_metadata?.name || user.email.split('@')[0],
                        surname: user.user_metadata?.surname || '',
                        company: user.user_metadata?.company || 'Independent Enterprise'
                    }]);

                if (profileError) throw new Error(`Profile sync layer failed: ${profileError.message}`);
            }

            // DUPLICATE GATE ROUTE: Check if registration plate is already recorded in active fleets
            const { data: duplicateCheck, error: checkError } = await supabase
                .from('ecoroute_vehicles')
                .select('id, make, model')
                .eq('user_id', user.id)
                .eq('registration_number', cleanRegNumber);

            if (checkError) throw checkError;

            if (duplicateCheck && duplicateCheck.length > 0) {
                const matchingCar = duplicateCheck[0];
                setAlertMsg({
                    type: 'error',
                    text: `⚠️ Duplicate Registration Blocked: Registration Number "${cleanRegNumber}" is already assigned to a ${matchingCar.make} ${matchingCar.model} in your fleet registry.`
                });
                setLoading(false);
                return;
            }

            // COMMIT VEHICLE RECORD: Safe write against your updated ecoroute_vehicles configuration layout
            const { error: insertError } = await supabase
                .from('ecoroute_vehicles')
                .insert([{
                    user_id: user.id,
                    make: selectedMake,
                    model: selectedModel,
                    year: Number(year),
                    registration_number: cleanRegNumber,
                    carbon_multiplier: 0.23
                }]);

            if (insertError) throw insertError;

            setSelectedMake('');
            setSelectedModel('');
            setRegNumber('');
            setYear(currentYear);
            onVehicleAdded();
            onClose();
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.message || 'Database pipeline sync exception.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 w-full max-w-md relative">
                <button onClick={() => { setAlertMsg({ type: '', text: '' }); onClose(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer text-sm">✕</button>
                <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-base font-bold text-white tracking-tight">Register Fleet Asset</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Secure registration validation checkpoint</p>
                </div>

                {alertMsg.text && (
                    <div className={`p-3 text-xs rounded-lg border ${alertMsg.type === 'error' ? 'bg-red-950/40 border-red-900/60 text-red-400' : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'}`}>
                        {alertMsg.text}
                    </div>
                )}

                <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturer</label>
                        <select value={selectedMake} onChange={(e) => setSelectedMake(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500" required>
                            <option value="">Select maker brand tracking node...</option>
                            {localCatalog.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Variant</label>
                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedMake} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-40" required>
                            <option value="">Select configuration model...</option>
                            {availableModels.map((modelName, index) => <option key={index} value={modelName}>{modelName}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Model Production</label>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500">
                            {yearsRange.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number / Plate</label>
                        <input type="text" placeholder="e.g. ND 123-456" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 uppercase" required />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-lg transition-transform active:scale-[0.99] cursor-pointer shadow-lg">
                        {loading ? 'Analyzing Registration Index...' : 'Verify & Add Car to Fleet List'}
                    </button>
                </form>
            </div>
        </div>
    );
}
