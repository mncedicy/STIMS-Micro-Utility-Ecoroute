// /src/app/components/DistanceField.jsx
'use client';

import React from 'react';

export default function DistanceField({ distance, setDistance, unit, setUnit }) {
    return (
        <div className="grid grid-cols-2 gap-2 font-mono text-xs items-end">
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">DISTANCE</label>
                <input
                    type="number"
                    step="any"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    required
                />
            </div>
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">UNIT</label>
                <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]"
                >
                    <option value="km">KM</option>
                    <option value="miles">MILES</option>
                </select>
            </div>
        </div>
    );
}
