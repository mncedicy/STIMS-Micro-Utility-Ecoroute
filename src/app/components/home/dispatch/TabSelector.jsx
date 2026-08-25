// src/app/components/home/dispatch/TabSelector.jsx

'use client';

import React from 'react';
import {
    Truck,
    Ship,
    Plane,
    Zap,
    Flame,
    Milestone,
    Coins
} from 'lucide-react';

export default function TabSelector({ activeTab, setActiveTab, setOpenDropdownKey }) {
    // Structured config array linking metadata layout parameters together cleanly
    const tabsConfig = [
        { id: 'vehicle', label: 'vehicle', icon: Truck },
        { id: 'shipping', label: 'shipping', icon: Ship },
        { id: 'flight', label: 'flight', icon: Plane },
        { id: 'electricity', label: 'electricity', icon: Zap },
        { id: 'gas', label: 'gas', icon: Flame },
        { id: 'route', label: 'route', icon: Milestone }, // your OSRM routing tool
        { id: 'tax', label: 'tax', icon: Coins }
    ];

    // Evaluates if the parameter states are full (a tab is currently active)
    const isFull = !!activeTab;

    return (
        /* 
           - grid-cols-2: 2 buttons per row on mobile frames
           - md:grid-cols-3: 3 buttons per row on medium screen sizes
           - xl: Updates layout dynamically based on state: 
             If full (active selected state), it shifts to 'xl:grid-cols-4'. 
             If empty/unselected, it maintains a clean 'xl:grid-cols-7'.
        */
        <div className={`w-full grid grid-cols-2 md:grid-cols-3 gap-1.5 border-b border-slate-900 pb-3 mb-4 font-mono text-[10px] ${isFull ? 'xl:grid-cols-4' : 'xl:grid-cols-7'
            }`}>
            {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (setOpenDropdownKey) setOpenDropdownKey(null);
                        }}
                        className={`group flex items-center justify-center space-x-2 py-2.5 px-3 rounded-md uppercase tracking-wider transition-all duration-200 cursor-pointer w-full text-ellipsis overflow-hidden border ${isActive
                            ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-950/40 border-slate-900/50 hover:border-slate-800/80 hover:bg-slate-900/30'
                            }`}
                    >
                        {/* Tab Contextual Icon Element - Updates colors and pulse dynamics contextually */}
                        <IconComponent
                            className={`w-3.5 h-3.5 transition-all duration-200 shrink-0
                                ${isActive
                                    ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse'
                                    : 'text-blue-500/70 group-hover:text-blue-400 group-hover:scale-105'
                                }
                            `}
                        />

                        <span className={`truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
