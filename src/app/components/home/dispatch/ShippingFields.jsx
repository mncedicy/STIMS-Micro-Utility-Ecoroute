// src/app/components/home/dispatch/ShippingFields.jsx
'use client';

import React from 'react';

export default function ShippingFields({
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    shippingMode,
    setShippingMode
}) {
    return (
        <div className="flex flex-col space-y-3 animate-fade-in font-mono text-xs mt-3">
            {/* Input Metric Matrix Row */}
            <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                    <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">CARGO WEIGHT</label>
                    <input
                        type="number"
                        step="any"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                        required
                    />
                </div>
                <div>
                    <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">MASS UNIT</label>
                    <select
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]"
                    >
                        <option value="kg">KG</option>
                        <option value="lbs">LBS</option>
                        <option value="tonnes">TONNES</option>
                    </select>
                </div>
            </div>

            {/* Injected Advanced Variable Transit Mode Row */}
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">LOGISTICS TRANSIT MODE</label>
                <select
                    value={shippingMode}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]"
                >
                    <option value="standard">Standard Freight Fallback (0.120 kg CO₂/t-km)</option>
                    <option value="road_heavy">Road Freight: Heavy Linehaul Truck (0.165 kg CO₂/t-km)</option>
                    <option value="road_light">Last-Mile Freight: Delivery Van (0.280 kg CO₂/t-km)</option>
                    <option value="rail">Rail Transport: Transnet Network (0.025 kg CO₂/t-km)</option>
                    <option value="ocean">Ocean Freight: Sea Container Ship (0.012 kg CO₂/t-km)</option>
                </select>
            </div>
        </div>
    );
}
