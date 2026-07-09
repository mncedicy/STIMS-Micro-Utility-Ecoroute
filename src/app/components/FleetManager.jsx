'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FleetManager({ user, isOpen, onClose, onVehicleAdded }) {
    // Built-in static catalog dataset mapping matching local logistics boundaries
    const localCatalog = [
        { id: "toyota-01", name: "Toyota", models: ["Hilux Bakkie", "Corolla", "Quantum Van", "Fortuner"] },
        { id: "ford-02", name: "Ford", models: ["Ranger Bakkie", "Transit Custom", "Everest"] },
        { id: "isuzu-03", name: "Isuzu", models: ["D-Max Bakkie", "N-Series Truck"] },
        { id: "vw-04", name: "Volkswagen", models: ["Caddy Cargo", "Crafter Van", "Polo Vivo"] },
        { id: "ferrari-05", name: "Ferrari", models: ["488 GTB", "Roma", "F8 Tributo"] }
    ];

    const [selectedMake, setSelectedMake] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [regNumber, setRegNumber] = useState(''); // Tracking state for Registration Number

    const [loading, setLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

    // Generate years list options from 1990 to Current Year + 1
    const currentYear = new Date().getFullYear();
    const maxYearRange = currentYear + 1;
    const yearsRange = [];
    for (let y = maxYearRange; y >= 1990; y--) {
        yearsRange.push(y);
    }

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
        if (!selectedMake || !selectedModel || !regNumber) return;

        setLoading(true);
        setAlertMsg({ type: '', text: '' });

        // Clean registration input parameters (trim white spaces and force uppercase alignment)
        const cleanRegNumber = regNumber.trim().toUpperCase();

        try {
            // 1. DUPLICATE VALIDATION GATE: Query database to see if the Registration Plate is already registered
            const { data: duplicateCheck, error: checkError } = await supabase
                .from('user_vehicles')
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

            // 2. INSERT RECORD: Commit clean parameters along with your custom tracking columns
            const { error: insertError } = await supabase
                .from('user_vehicles')
                .insert([{
                    user_id: user.id,
                    make: selectedMake,
                    model: selectedModel,
                    year: Number(year),
                    registration_number: cleanRegNumber,
                    carbon_multiplier: 0.23
                }]);

            if (insertError) throw insertError;

            // Reset internal memory maps and trigger parent re-hydration events
            setSelectedMake('');
            setSelectedModel('');
            setRegNumber('');
            setYear(currentYear);
            onVehicleAdded();
            onClose();
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.message || 'Database pipeline connectivity fault.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 w-full max-w-md relative">

                <button onClick={() => { setAlertMsg({ type: '', text: '' }); onClose(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer text-sm">
                    ✕
                </button>

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
                        <select
                            value={selectedMake}
                            onChange={(e) => setSelectedMake(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                            required
                        >
                            <option value="">Select maker brand tracking node...</option>
                            {localCatalog.map((brand) => (
                                <option key={brand.id} value={brand.name}>{brand.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Variant</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={!selectedMake}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-40"
                            required
                        >
                            <option value="">Select configuration model...</option>
                            {availableModels.map((modelName, index) => (
                                <option key={index} value={modelName}>{modelName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Model Production</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                        >
                            {yearsRange.map((yr) => (
                                <option key={yr} value={yr}>{yr}</option>
                            ))}
                        </select>
                    </div>

                    {/* New Input Field for Car License Plate / Registration ID */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number / Plate</label>
                        <input
                            type="text"
                            placeholder="e.g. ND 123-456 or GP STIMS ZN"
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 uppercase placeholder:normal-case"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-lg transition-transform active:scale-[0.99] cursor-pointer shadow-lg"
                    >
                        {loading ? 'Analyzing Registration Index...' : 'Verify & Add Car to Fleet List'}
                    </button>
                </form>
            </div>
        </div>
    );
}
