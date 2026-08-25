// src/app/components/home/dispatch/DistanceField.js

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// FIXED LAZY LOADING LAYER: ssr: false ensures that canvas operations compile only inside client context
const DistanceMapModal = dynamic(
    () => import('./DistanceMapModal'),
    {
        ssr: false,
        loading: () => null // Silent background initialization handler
    }
);

export default function DistanceField({ distance, setDistance, unit, setUnit, setOsrmTotalDuration, setOsrmLegsData, setOsrmWaypointsData }) {
    const [isMapOpen, setIsMapOpen] = useState(false);

    const handleDistancePopulate = (calculatedKm, duration, legs, waypoints) => {
        if (unit === 'miles') {
            setDistance((calculatedKm * 0.621371).toFixed(1));
        } else {
            setDistance(calculatedKm.toFixed(1));
        }

        if (setOsrmTotalDuration) setOsrmTotalDuration(duration);
        if (setOsrmLegsData) setOsrmLegsData(legs);
        if (setOsrmWaypointsData) setOsrmWaypointsData(waypoints);

        setIsMapOpen(false);
    };

    return (
        <div className="grid grid-cols-2 gap-2 font-mono text-xs items-end relative">
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">DISTANCE (KM)</label>
                <div className="relative w-full flex items-center">
                    <input type="number" step="any" value={distance} onChange={(e) => setDistance(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded pl-3 pr-8 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs" required />
                    <button type="button" onClick={() => setIsMapOpen(true)} className="absolute right-2.5 text-blue-500 hover:text-blue-400 cursor-pointer text-[13px] bg-transparent border-none outline-none p-0">
                        🗺️
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">UNIT</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]">
                    <option value="km">KM</option>
                    {/* <option value="miles">MILES</option> */}
                </select>
            </div>

            {isMapOpen && (
                <DistanceMapModal
                    onClose={() => setIsMapOpen(false)}
                    onSelectDistance={handleDistancePopulate}
                />
            )}
        </div>
    );
}
