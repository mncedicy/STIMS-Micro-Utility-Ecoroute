// src/app/components/fleet/asset/list/FleetGridContainer.jsx

'use client';

import React from 'react';
import { FleetDesktopRow, FleetMobileCard } from '../FleetAssetRow';

export default function FleetGridContainer({ customVehicles = [], selectedVehicle, onSelectVehicle }) {
    return (
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent">
            {/* 1. MOBILE RESPONSIVE GRID LAYOUT */}
            <div className="block md:hidden space-y-3">
                {customVehicles.map((vehicle, index) => (
                    <FleetMobileCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        index={index + 1}
                        isSelected={selectedVehicle?.id === vehicle.id}
                        onSelectVehicle={onSelectVehicle}
                    />
                ))}
            </div>

            {/* 2. DESKTOP TABULAR MATRIX LAYOUT */}
            <div className="hidden md:block overflow-x-auto relative">
                <table className="w-full text-xs text-left text-slate-300 border-collapse">
                    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-sm z-10">
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                            <th className="py-2.5 px-3 w-12 text-slate-600">#</th>
                            <th className="py-2.5 px-3 w-1/3">REGISTRATION</th>
                            <th className="py-2.5 px-3 w-2/3">MANUFACTURER REGISTRY</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-slate-300">
                        {customVehicles.map((vehicle, index) => (
                            <FleetDesktopRow
                                key={vehicle.id}
                                vehicle={vehicle}
                                index={index + 1}
                                isSelected={selectedVehicle?.id === vehicle.id}
                                onSelectVehicle={onSelectVehicle}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
