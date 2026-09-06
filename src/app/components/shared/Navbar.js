// src\app\components\shared\Navbar.js

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';

export default function Navbar({ user, activeViewPage, onNavigateViewPage }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleGoHomeRoute = (e) => {
        e.preventDefault();
        onNavigateViewPage('dashboard');
    };

    useEffect(() => {
        function clickOutsideHandler(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', clickOutsideHandler);
        return () => document.removeEventListener('mousedown', clickOutsideHandler);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md z-50">
            <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">

                <div className="flex items-center space-x-3">
                    <a href="#" onClick={handleGoHomeRoute} className="flex items-center group shrink-0 transition-transform active:scale-[0.98]">
                        <Image src="/logo.png" alt="STIMS Logo" width={70} height={70} className="object-contain" priority />
                    </a>
                </div>

                <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
                    {user && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="font-mono text-[11px] text-slate-300 hover:text-white bg-slate-950 border border-slate-900 focus:border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2 cursor-pointer shadow-sm stims-hover-glow transition-all"
                            >
                                <span className="max-w-[120px] truncate">{user.email}</span>
                                <span className="text-slate-600 text-[8px] tracking-tighter">▼</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 md:w-[420px] bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 font-mono text-[11px] animate-fade-in space-y-3">

                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">SYSTEM LINKS DIRECTORY</div>

                                    {/* 2 COLUMNS ON DESKTOP, 1 COLUMN ON MOBILE */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                                        <button
                                            type="button"
                                            onClick={() => { onNavigateViewPage('dashboard'); setIsDropdownOpen(false); }}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider rounded-lg border border-transparent stims-hover-glow transition-all"
                                        >
                                            🏠 Home
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { onNavigateViewPage('emission_history'); setIsDropdownOpen(false); }}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider rounded-lg border border-transparent stims-hover-glow transition-all"
                                        >
                                            📊 Emission History
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { onNavigateViewPage('fleet'); setIsDropdownOpen(false); }}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider rounded-lg border border-transparent stims-hover-glow transition-all"
                                        >
                                            🚛 Fleet Assets
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { onNavigateViewPage('referrals'); setIsDropdownOpen(false); }}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-emerald-400 hover:text-emerald-300 uppercase tracking-wider font-bold rounded-lg border border-transparent stims-hover-glow transition-all"
                                        >
                                            💰 Referrals & Cashout
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { onNavigateViewPage('developer_api'); setIsDropdownOpen(false); }}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-slate-400 hover:text-white uppercase tracking-wider rounded-lg border border-transparent stims-hover-glow transition-all"
                                        >
                                            💻 Developer API Panel
                                        </button>

                                        {/* Placed inside the grid layout to sit side-by-side with Developer API Panel */}
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-left cursor-pointer px-3 py-2 text-rose-500 rounded-lg border border-transparent stims-hover-glow-danger transition-all uppercase tracking-wider text-[11px]"
                                        >
                                            🔒 Log Out
                                        </button>

                                    </div>

                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
