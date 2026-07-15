'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ user, activeViewPage, onNavigateViewPage }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        setIsLeaveModalOpen(true);
    };

    const handleGoHomeRoute = (e) => {
        e.preventDefault();
        onNavigateViewPage('dashboard');
    };

    const executeLeaveRedirection = () => {
        setIsLeaveModalOpen(false);
        window.location.href = "https://stims.co.za";
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
                    <a href="https://stims.co.za" onClick={handleLogoClick} className="flex items-center group shrink-0">
                        <Image src="/logo.png" alt="STIMS Logo" width={70} height={70} className="object-contain" priority />
                    </a>
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <button type="button" onClick={handleGoHomeRoute} className="font-mono text-xs text-slate-600 hover:text-blue-500 cursor-pointer transition-colors bg-transparent border-none p-0 flex items-center space-x-3">
                        <span className="text-blue-500 font-bold uppercase tracking-wider pl-0.5">EcoRoute</span>
                    </button>
                </div>

                <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
                    {user && (
                        <div className="relative">
                            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="font-mono text-[11px] text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all">
                                <span className="max-w-[120px] truncate">{user.email}</span>
                                <span className="text-slate-600 text-[9px] uppercase tracking-tighter">▼</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1.5 z-50 font-mono text-xs animate-fade-in">
                                    <button type="button" onClick={() => { onNavigateViewPage('dashboard'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-950 transition-colors uppercase tracking-wider text-slate-400">🏠 Home</button>
                                    <button type="button" onClick={() => { onNavigateViewPage('fleet'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-950 transition-colors uppercase tracking-wider text-slate-400">🚛 Fleet Assets</button>
                                    <div className="border-t border-slate-800/60 my-1" />
                                    <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-2 text-rose-500 hover:bg-rose-950/20 transition-colors uppercase tracking-widest text-[10px]">🔒 Log Out</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODIFIED: Changed layout alignment properties to push the leave card modal down safely with a nice top margin anchor row padding (pt-20 items-start) */}
            {isLeaveModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-start justify-center p-4 pt-20 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
                    <div className="w-full max-w-sm p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto">
                        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">LEAVING PAGE WARNING</h4>
                        </div>
                        <div className="text-xs space-y-2 text-slate-400 leading-relaxed">
                            <p className="font-bold text-slate-200">You are about leave this page to Stims Home.</p>
                            <p>Any unsaved calculator data might be lost. Do you want to go to the main website?</p>
                        </div>
                        <div className="flex space-x-2 pt-2 text-[10px]">
                            <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded transition-colors uppercase tracking-wider">STAY HERE</button>
                            <button type="button" onClick={executeLeaveRedirection} className="flex-1 bg-blue-900/30 border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white font-bold py-2 rounded transition-all uppercase tracking-wider">GO TO HOME WEBSITE</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
