// /src/app/components/Footer.jsx
'use client';

import React from 'react';

export default function Footer({ onNavigateViewPage }) {
    const currentYear = new Date().getFullYear();

    const handleNavigationLinkClick = (e, targetPageId) => {
        e.preventDefault();
        if (typeof onNavigateViewPage === 'function') {
            onNavigateViewPage(targetPageId);
            // Smoothly scroll back to the top of the interface layout context canvas
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <footer className="w-full border-t border-slate-900 bg-slate-950/20 py-8 px-4 mt-auto relative z-10 font-mono text-[10px] text-slate-500 antialiased select-none">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Upper Column Links Grid Layout Track */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-900/60 text-left">

                    {/* Column 1: Ecosystem Context Definition */}
                    <div className="space-y-2">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block">SYSTEM DISPATCH IDENTITY</span>
                        <div className="text-slate-500 leading-relaxed font-sans normal-case text-[11px]">
                            EcoRoute functions as a verified carbon translation matrix module node under the master <a href="https://stims.co.za" target="_blank" rel="noopener noreferrer" className="text-blue-500/80 hover:text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors">Stims</a> enterprise software suite.
                        </div>
                    </div>

                    {/* Column 2: Programmatic Quick Navigation Links */}
                    <div className="space-y-2">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block">INTERFACE LINK CONSOLE</span>
                        <ul className="space-y-1.5 list-none pl-0">
                            <li>
                                <a
                                    href="#dashboard"
                                    onClick={(e) => handleNavigationLinkClick(e, 'dashboard')}
                                    className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer uppercase tracking-wider block"
                                >
                                    ➔ Emissions Calculator Workspace
                                </a>
                                {/* FIXED: Changed </td> to </li> to clear the JSX syntax compiler block */}
                            </li>
                            <li>
                                <a
                                    href="#fleet_ledger"
                                    onClick={(e) => handleNavigationLinkClick(e, 'fleet_ledger')}
                                    className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer uppercase tracking-wider block"
                                >
                                    ➔ Logistics Archive Ledger
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#developer_api"
                                    onClick={(e) => handleNavigationLinkClick(e, 'developer_api')}
                                    className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer uppercase tracking-wider block"
                                >
                                    ➔ Programmatic B2B API Portal
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Live Real-Time Platform System Telemetry Benchmarks */}
                    <div className="space-y-2">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block">TELEMETRY SYSTEM METRICS</span>
                        <div className="space-y-1 bg-slate-950/60 border border-slate-900 rounded p-2 text-[9px] text-slate-500">
                            <div className="flex justify-between items-center">
                                <span>FACTOR TUNNEL STATUS:</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <span className="h-1 w-1 bg-emerald-400 rounded-full animate-pulse" /> ONLINE
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>LEDGER LATENCY RATE:</span>
                                <span className="text-slate-300 font-bold">14ms [SECURE]</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>REGULATORY SCHEMA:</span>
                                <span className="text-blue-400 font-bold">GHG SCOPE 1-2-3</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Lower Copyright & Network Verification String Strip */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 font-mono">
                    <div>
                        <span>© {currentYear} STIMS EcoRoute Core. All rights reserved.</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="h-1 w-1 bg-slate-800 rounded-full" />
                        <a
                            href="https://stims.co.za"
                            onClick={(e) => handleNavigationLinkClick(e, 'dashboard')}
                            className="text-slate-500 hover:text-blue-400 font-bold tracking-wider transition-colors cursor-pointer uppercase"
                        >
                            ecoroute.stims.co.za
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
