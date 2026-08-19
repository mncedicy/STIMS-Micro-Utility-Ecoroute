'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HeroHeader({ onGetStartedClick, appMeta }) {

    const ref = useRef(null);
    const [motion, setMotion] = useState('');


    const onMove = (e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setMotion(`translate(${(e.clientX - (r.left + r.width / 2)) / 30}px, ${(e.clientY - (r.top + r.height / 2)) / 30}px)`);
    };


    // Graceful defensive variable mapping lookups
    const activeCategory = appMeta?.category || 'LOGISTICS';
    const activeTitle = appMeta?.title || 'ECOROUTE';
    const activeTagline = appMeta?.tagline || 'FLEET CARBON ANALYTICS';
    const activeDescription = appMeta?.description || 'Automated mileage-to-emissions translation engine built specifically for independent local courier services.';
    const activeLink = appMeta?.app_link || '';

    return (
        <>
            <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { setMotion(''); }}
                style={{ transform: motion }} className="w-full max-w-3xl mx-auto text-center space-y-6 relative z-10 animate-fade-in-up">

                {/* FIXED: Perfectly Centered Top Level Ecosystem Logo Container Block */}
                <div className="w-full flex items-center justify-center px-3 py-1.5 pt-8 mx-auto select-none">
                    <img
                        src="/logo.png"
                        alt="Stims Ecosystem Logo"
                        className="h-18 w-auto object-contain opacity-90 brightness-110"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>

                {/* Core Brand Message Headings */}
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                    <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">{activeTagline.trim()}</span>
                </h1>

                {/* Dynamic Classification Tier Tag Label */}
                <div className="inline-flex items-center space-x-2 bg-blue-950/30 border  border-blue-900/40 px-3 py-1.5 rounded-lg shadow-sm mx-auto select-none">
                    <span className="h-1 w-1 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 font-bold text-[9px] uppercase tracking-widest font-mono">
                        Ecosystem Sector: {activeCategory.trim().toUpperCase()}
                    </span>
                </div>

                <div className="space-y-2">
                    <p className="text-xs md:text-sm font-sans normal-case text-slate-400 max-w-xl mx-auto leading-relaxed pt-1">
                        {activeDescription.trim()}
                    </p>
                </div>

                {/* FIXED WIDTH & HEIGHT ACTION PANEL: Enforces absolute mathematical button equality */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2 w-full">

                    {/* Primary Launch Action Button */}
                    <button
                        type="button"
                        onClick={onGetStartedClick}
                        className="w-full h-10 sm:h-12 box-border flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-transparent text-white font-bold text-[11px] uppercase tracking-wider px-5 rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer select-none active:scale-[0.99] transform hover:-translate-y-0.5 duration-150 font-mono stims-hover-glow"
                    >
                        Launch {activeTitle.trim()} Instance ➔
                    </button>

                    {/* Secondary Documentation Reference Anchor Link */}
                    {activeLink && (
                        <a
                            href={activeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-10 sm:h-12 box-border flex items-center justify-center bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-[11px] uppercase tracking-wider px-5 rounded-lg transition-all select-none transform hover:-translate-y-0.5 duration-150 shadow-sm font-mono stims-hover-glow"
                        >
                            Review Source Link
                        </a>
                    )}
                </div>
            </div>
        </>
    );
}
