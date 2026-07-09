'use client';
import { useState } from 'react';

export default function DispatchForm({
    distance, setDistance, unit, setUnit, onSubmit, loading, errorMsg,
    customVehicles, selectedCustomVehicle, setSelectedCustomVehicle
}) {
    const [category, setCategory] = useState('vehicle');
    const [weight, setWeight] = useState(2000);
    const [weightUnit, setWeightUnit] = useState('kg');
    const [passengers, setPassengers] = useState(1);
    const [origin, setOrigin] = useState('JNB');
    const [destination, setDestination] = useState('DUR');

    const triggerFormSubmit = (e) => {
        e.preventDefault();
        let structuredPayload = { type: category };

        if (category === 'vehicle') {
            structuredPayload = {
                ...structuredPayload,
                distance_value: distance,
                distance_unit: unit,
                vehicle_model_id: selectedCustomVehicle
            };
        } else if (category === 'shipping') {
            structuredPayload = { ...structuredPayload, distance_value: distance, distance_unit: unit, weight_value: weight, weight_unit: weightUnit, transport_method: 'ship' };
        } else if (category === 'flight') {
            structuredPayload = { ...structuredPayload, passengers, legs: [{ departure_airport: origin, destination_airport: destination }] };
        }

        onSubmit(structuredPayload);
    };

    // FIXED: Filters the selector dropdown menu list to strictly loop out cars where is_active is true
    const activeCustomVehiclesOnly = customVehicles ? customVehicles.filter(car => car.is_active !== false) : [];

    return (
        <form onSubmit={triggerFormSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
                <h1 className="text-lg font-bold text-white tracking-tight">EcoRoute Dispatch</h1>
                <p className="text-xs text-slate-400">Configure logistics travel boundaries</p>
            </div>

            {errorMsg && <div className="p-3 text-xs bg-red-950/40 border border-red-900 text-red-400 rounded-lg">{errorMsg}</div>}

            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['vehicle', 'shipping', 'flight'].map((cat) => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} className={`text-xs py-1.5 font-medium rounded capitalize transition-all cursor-pointer ${category === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* --- VEHICLE CUSTOM FLEET SELECTION --- */}
            {category === 'vehicle' && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Select Saved Custom Fleet Car</label>

                    {activeCustomVehiclesOnly.length > 0 ? (
                        <select value={selectedCustomVehicle} onChange={(e) => setSelectedCustomVehicle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500" required>
                            <option value="">Choose a vehicle from your saved fleet list...</option>
                            {activeCustomVehiclesOnly.map((car) => (
                                <option key={car.id} value={car.id}>
                                    {car.make} {car.model} ({car.year}) — [{car.registration_number || 'NO PLATE'}]
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-center p-4 border border-dashed border-slate-800 bg-slate-950/60 rounded-lg text-xs text-slate-400">
                            ⚠️ No vehicles listed. Please click <strong className="text-emerald-400">"🚗 Add Fleet Car"</strong> above to register an asset first.
                        </div>
                    )}
                </div>
            )}

            {/* --- SHIPPING FORM EXTENSION --- */}
            {category === 'shipping' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cargo Weight</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">W-Unit</label>
                        <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500">
                            <option value="kg">KG</option>
                            <option value="lb">LBS</option>
                        </select>
                    </div>
                </div>
            )}

            {/* --- AVIATION FORM EXTENSION --- */}
            {category === 'flight' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pax Count</label>
                        <input type="number" min="1" value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Origin</label>
                        <input type="text" maxLength="3" value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dest</label>
                        <input type="text" maxLength="3" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono" required />
                    </div>
                </div>
            )}

            {category !== 'flight' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Route Length</label>
                        <input type="number" min="0.1" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">D-Unit</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500">
                            <option value="km">KM</option>
                            <option value="mi">MI</option>
                        </select>
                    </div>
                </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-lg py-2.5 text-sm font-semibold tracking-wide active:scale-[0.99] transition-transform disabled:opacity-50 cursor-pointer">
                {loading ? 'Processing Audit Run...' : 'Run Carbon Analysis'}
            </button>
        </form>
    );
}
