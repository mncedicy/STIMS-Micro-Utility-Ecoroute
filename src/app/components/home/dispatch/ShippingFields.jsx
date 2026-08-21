// src\app\components\home\dispatch\ShippingFields.jsx

'use client';

import React from 'react';

export default function ShippingFields({ weight, setWeight, weightUnit, setWeightUnit }) {
    return (
        <div className="grid grid-cols-2 gap-2 animate-fade-in font-mono text-xs items-end mt-3">
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
    );
}
