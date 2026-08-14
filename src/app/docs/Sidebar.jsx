// src/app/docs/Sidebar.jsx
'use client';

import React from 'react';
import { CORE_GUIDES } from './coreGuidesData';
import { API_ENDPOINTS } from './endpointsData';

export default function Sidebar({ activeSection, onSectionClick }) {
    return (
        <aside className="w-60 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto border-r border-slate-900/60 p-4 hidden md:block select-none text-left bg-slate-950 shrink-0">
            <div className="space-y-5">
                <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">Core Guides</h4>
                    <nav className="flex flex-col space-y-0.5">
                        {Object.keys(CORE_GUIDES).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onSectionClick(key)}
                                className={`w-full text-left px-2 py-1.5 rounded transition-all text-[11px] font-bold uppercase tracking-wider truncate ${activeSection === key ? 'bg-blue-950/40 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:text-slate-200 bg-transparent'
                                    }`}
                            >
                                {CORE_GUIDES[key].title}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">API Endpoints Matrix</h4>
                    <nav className="flex flex-col space-y-0.5">
                        {API_ENDPOINTS.map((ep) => (
                            <button
                                key={ep.id}
                                type="button"
                                onClick={() => onSectionClick(ep.id)}
                                className={`w-full text-left px-2 py-1.5 rounded transition-all text-[11px] flex items-center justify-between gap-1.5 font-bold truncate ${activeSection === ep.id ? 'bg-slate-900 text-white border-r-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <span className="truncate tracking-wide text-[10px] font-sans font-medium text-slate-300">{ep.name}</span>
                                <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 ${ep.method === 'POST' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40' : 'bg-blue-950/60 text-blue-400 border border-blue-900/40'
                                    }`}>
                                    {ep.method}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
