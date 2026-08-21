// src\app\components\shared\SystemDialogModal.jsx

'use client';

import React from 'react';

export default function SystemDialogModal({
    isOpen,
    status = 'blue', // 'blue', 'green', or 'red'
    title,
    message,
    confirmText = 'ACKNOWLEDGE',
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    // Resolve structural status outline accents dynamically
    const accentColorsMatrix = {
        blue: { border: 'border-blue-900', text: 'text-blue-400', bg: 'bg-blue-950/20' },
        green: { border: 'border-emerald-900', text: 'text-emerald-400', bg: 'bg-emerald-950/20' },
        red: { border: 'border-rose-900', text: 'text-rose-400', bg: 'bg-rose-950/20' }
    };

    const currentAccent = accentColorsMatrix[status] || accentColorsMatrix.blue;

    return (
        /* MODIFIED LAYOUT: Shifted from flex centering to items-start with pt-16 ensuring content scaling anchors perfectly on top of screens */
        <div className="fixed inset-0 w-full h-full flex justify-center items-start pt-16 p-4  pt-50 z-[9999] select-none font-mono text-xs overflow-y-auto">
            {/* Dark glass backdrop layout mask */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onCancel || (() => { })}
            />

            {/* Centered Modal Dialogue Content Card Box */}
            <div className={`w-full max-w-sm h-auto bg-[#090d22] border ${currentAccent.border} rounded-xl p-6 shadow-2xl relative z-10 animate-fade-in space-y-5 text-left stims-hover-glow`}>

                {/* Upper Heading Header Row */}
                <div className="border-b border-slate-900 pb-2.5">
                    <span className={`${currentAccent.text} font-black tracking-wider text-[10px] uppercase block mb-0.5`}>
                        ⚙️ SYSTEM DIALOG CONSOLE // {status.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                        {title || 'OPERATION ALERT'}
                    </h4>
                </div>

                {/* Plain English Core Message Body Block */}
                <p className="text-slate-400 text-[11px] leading-relaxed font-sans normal-case">
                    {message}
                </p>

                {/* Dynamic Responsive Submittal Controls Row */}
                <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-900/60">
                    {/* Render optional cancel handle button triggers cleanly */}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm shadow-blue-600/10 cursor-pointer`}
                    >
                        {confirmText}
                    </button>
                </div>

            </div>
        </div>
    );
}
