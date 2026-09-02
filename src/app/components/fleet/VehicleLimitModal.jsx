'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function VehicleLimitModal({
    isOpen,
    isPending = false,
    onUpgrade,
    onCancel
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[99999] select-none font-mono text-xs overflow-y-auto">
            {/* Dark glass backdrop layout mask */}
            <div
                className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onCancel}
            />

            {/* Centered Modal Dialogue Content Card Box */}
            <div className="w-full max-w-sm h-auto bg-[#090d22] border border-blue-900 rounded-xl p-6 shadow-2xl relative z-10 animate-fade-in space-y-5 text-left stims-hover-glow">

                {/* Upper Heading Header Row */}
                <div className="border-b border-slate-900 pb-2.5">
                    <span className="text-blue-400 font-black tracking-wider text-[10px] uppercase block mb-0.5">
                        ⚙️ SYSTEM DIALOG CONSOLE // LIMIT
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                        VEHICLE REGISTRY LIMIT
                    </h4>
                </div>

                {/* Message Body Block */}
                <div className="text-slate-400 text-[11px] leading-relaxed font-sans space-y-2">
                    <p className="font-bold text-slate-200">
                        Free plans are limited to 1 vehicle entry.
                    </p>
                    <p>
                        To track unlimited fleet assets, analyze trends, and unlock print certificates, please upgrade your utility profile tier.
                    </p>
                </div>

                {/* Submittal Controls Row */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-900/60">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onUpgrade}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm shadow-blue-600/10 cursor-pointer text-center disabled:opacity-40"
                    >
                        {isPending ? "Connecting..." : "⭐ Upgrade to Pro (R280 per month)"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 font-mono font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}