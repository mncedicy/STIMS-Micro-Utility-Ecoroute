// src/app/components/fleet/asset/DeleteVehicleModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function DeleteVehicleModal({
    vehicle,
    deleting = false,
    onConfirm,
    onCancel,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!vehicle || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[99999] select-none font-mono text-xs overflow-y-auto">
            {/* Dark glass backdrop layout mask */}
            <div
                className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onCancel || (() => { })}
            />

            {/* Centered Modal Dialogue Content Card Box */}
            <div className="w-full max-w-sm h-auto bg-[#090d22] border border-rose-900 rounded-xl p-6 shadow-2xl relative z-10 animate-fade-in space-y-5 text-left stims-hover-glow">

                {/* Upper Heading Header Row */}
                <div className="border-b border-slate-900 pb-2.5">
                    <span className="text-rose-400 font-black tracking-wider text-[10px] uppercase block mb-0.5">
                        ⚙️ SYSTEM DIALOG CONSOLE // RED
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                        DE-REGISTRATION AUDIT CONFIRMATION
                    </h4>
                </div>

                {/* Plain English Core Message Body Block */}
                <p className="text-slate-400 text-[11px] leading-relaxed font-sans normal-case">
                    Are you sure you want to terminate fleet node tracking assets for:
                    <span className="block mt-2.5 font-bold font-mono text-blue-400 border-l-2 border-blue-500 pl-2.5 bg-slate-950/60 py-2 rounded-r border-t border-r border-b border-slate-900">
                        [{vehicle.registration_number || 'N/A'}] {vehicle.make} {vehicle.model}
                    </span>
                </p>

                {/* Dynamic Responsive Submittal Controls Row */}
                <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-900/60">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                        ABORT ACTION
                    </button>

                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onConfirm}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm shadow-rose-600/10 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {deleting ? 'DELETING...' : 'CONFIRM REMOVAL'}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}