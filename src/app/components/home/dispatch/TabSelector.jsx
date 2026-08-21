// src/app/components/home/dispatch/TabSelector.jsx

'use client';

import React from 'react';

export default function TabSelector({ activeTab, setActiveTab, setOpenDropdownKey }) {
    const tabs = ['vehicle', 'shipping', 'flight', 'electricity', 'gas', 'route', 'tax'];

    return (
        <div className="w-full grid grid-cols-7 gap-1 border-b border-slate-800 pb-3 mb-4 font-mono text-[10px]">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => {
                        setActiveTab(tab);
                        setOpenDropdownKey(null); // Dismiss open fields across tab changes cleanly
                    }}
                    className={`text-center py-1.5 rounded-md uppercase tracking-wider transition-colors cursor-pointer w-full text-ellipsis overflow-hidden ${activeTab === tab
                        ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
                        }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
