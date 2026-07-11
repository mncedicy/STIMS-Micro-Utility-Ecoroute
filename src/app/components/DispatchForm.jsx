// src/app/components/DispatchForm.jsx
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
            structuredPayload = { ...structuredPayload, distance_value: distance, distance_unit: unit, vehicle_model_id: selectedCustomVehicle };
        } else if (category === 'shipping') {
            structuredPayload = { ...structuredPayload, distance_value: distance, distance_unit: unit, weight_value: weight, weight_unit: weightUnit, transport_method: 'ship' };
        } else if (category === 'flight') {
            structuredPayload = { ...structuredPayload, passengers, legs: [{ departure_airport: origin, destination_airport: destination }] };
        }
        onSubmit(structuredPayload);
    };

    const activeCustomVehiclesOnly = customVehicles ? customVehicles.filter(car => car.is_active !== false) : [];

    return (
        <form onSubmit={triggerFormSubmit} className="stims-panel-card space-y-4">
            <div>
                <h3 className="text-sm font-bold text-white tracking-tight">EcoRoute Dispatch</h3>
                <p className="text-[11px] text-slate-500 font-sans">Configure cargo transit lines and routing parameters</p>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#020617] p-1 rounded-lg border border-slate-900">
                {['vehicle', 'shipping', 'flight'].map((cat) => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} className={`text-[10px] font-mono uppercase tracking-wider py-1 font-bold rounded transition-all cursor-pointer ${category === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {category === 'vehicle' && (
                <div className="space-y-1">
                    <label className="stims-label">Select Active Corporate Car</label>
                    {activeCustomVehiclesOnly.length > 0 ? (
                        /* FIXED: Removed the accidental '安全' token typo string entirely */
                        <select value={selectedCustomVehicle} onChange={(e) => setSelectedCustomVehicle(e.target.value)} className="stims-select font-sans" 安全="" required>
                            <option value="">Choose a tracking node vehicle registry profile...</option>
                            {activeCustomVehiclesOnly.map((car) => (
                                <option key={car.id} value={car.id} className="bg-[#020617] text-white">
                                    {car.make} {car.model} — [{car.registration_number || 'NO PLATE'}]
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-center p-4 border border-dashed border-slate-900 bg-[#020617]/50 rounded-lg text-[11px] text-slate-500 font-mono">
                            ⚠️ NO CORPORATE ROSTER CORES ACCESS DETECTED. CLICK REGISTER ABOVE.
                        </div>
                    )}
                </div>
            )}

            {category === 'shipping' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                        <label className="stims-label">Manifest Total Weight</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="stims-input font-mono" required />
                    </div>
                    <div className="space-y-1">
                        <label className="stims-label">Mass Unit</label>
                        <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="stims-select font-mono">
                            <option value="kg" className="bg-[#020617]">KG</option>
                            <option value="lb" className="bg-[#020617]">LBS</option>
                        </select>
                    </div>
                </div>
            )}

            {category === 'flight' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="stims-label">Pax Count</label>
                        <input type="number" min="1" value={passengers} onChange={(e) => setPassengers(e.target.value)} className="stims-input font-mono" required />
                    </div>
                    <div className="space-y-1">
                        <label className="stims-label">Origin IATA</label>
                        <input type="text" maxLength="3" value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} className="stims-input font-mono tracking-widest text-center text-blue-400 font-bold" required />
                    </div>
                    <div className="space-y-1">
                        <label className="stims-label">Dest IATA</label>
                        <input type="text" maxLength="3" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} className="stims-input font-mono tracking-widest text-center text-blue-400 font-bold" required />
                    </div>
                </div>
            )}

            {category !== 'flight' && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                        <label className="stims-label">Route Length Bounds</label>
                        <input type="number" min="0.1" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} className="stims-input font-mono" required />
                    </div>
                    <div className="space-y-1">
                        <label className="stims-label">Dist Unit</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="stims-select font-mono">
                            <option value="km" className="bg-[#020617]">KM</option>
                            <option value="mi" className="bg-[#020617]">MI</option>
                        </select>
                    </div>
                </div>
            )}

            <button type="submit" disabled={loading} className="stims-btn-primary w-full mt-2">
                {loading ? "Calculating Telemetry Metrics..." : "⚡ Execute Environmental Audit Run"}
            </button>
        </form>
    );
}
