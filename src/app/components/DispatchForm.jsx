'use client';

import React, { useState } from 'react';

export default function DispatchForm({
    distance, setDistance, unit, setUnit, onSubmit, loading, customVehicles, selectedCustomVehicle, setSelectedCustomVehicle
}) {
    const [activeTab, setActiveTab] = useState('vehicle');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');
    const [depAirport, setDepAirport] = useState('');
    const [destAirport, setDestAirport] = useState('');
    const [passengers, setPassengers] = useState(1);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (activeTab === 'vehicle') {
            onSubmit({ type: 'vehicle', distance_value: distance, distance_unit: unit, vehicle_model_id: selectedCustomVehicle });
        } else if (activeTab === 'shipping') {
            onSubmit({ type: 'shipping', distance_value: distance, distance_unit: unit, weight_value: weight, weight_unit: weightUnit });
        } else if (activeTab === 'flight') {
            onSubmit({ type: 'flight', passengers, legs: [{ departure_airport: depAirport.toUpperCase(), destination_airport: destAirport.toUpperCase() }] });
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative group">
            <div className="flex border-b border-slate-800 pb-3 mb-4 space-x-2 font-mono text-[11px]">
                {['vehicle', 'shipping', 'flight'].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
                {activeTab !== 'flight' && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">DISTANCE</label>
                            <input
                                type="number"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">UNIT</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="mi">MI</option>
                                <option value="km">KM</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'vehicle' && (
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">SELECT FLEET ASSET</label>
                        <select
                            value={selectedCustomVehicle}
                            onChange={(e) => setSelectedCustomVehicle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                            required
                        >
                            <option value="">-- CHOOSE VEHICLE --</option>
                            {customVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.registration_number || v.registration ? `[${v.registration_number || v.registration}] ` : ''}{v.make} {v.model} ({v.year})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {activeTab === 'shipping' && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">CARGO WEIGHT</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">MASS UNIT</label>
                            <select
                                value={weightUnit}
                                onChange={(e) => setWeightUnit(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="kg">KG</option>
                                <option value="lb">LB</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'flight' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">ORIGIN (IATA)</label>
                                <input
                                    type="text"
                                    maxLength={3}
                                    placeholder="JNB"
                                    value={depAirport}
                                    onChange={(e) => setDepAirport(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 uppercase placeholder:text-slate-800"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">DEST (IATA)</label>
                                <input
                                    type="text"
                                    maxLength={3}
                                    placeholder="CPT"
                                    value={destAirport}
                                    onChange={(e) => setDestAirport(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 uppercase placeholder:text-slate-800"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider">PASSENGERS COUNT</label>
                            <input
                                type="number"
                                min={1}
                                value={passengers}
                                onChange={(e) => setPassengers(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                required
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    /* MODIFIED: Added stims-hover-glow to project intense neon aura shadows onto primary submit actions */
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all uppercase text-[11px] tracking-widest disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] stims-hover-glow cursor-pointer"
                >
                    {loading ? 'CALCULATING EMISSIONS...' : 'EXECUTE LOGISTICS AUDIT'}
                </button>
            </form>
        </div>
    );
}
