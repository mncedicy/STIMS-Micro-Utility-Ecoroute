'use client';

import React, { useState } from 'react';

export default function EmissionHeader({
    handleBackupDownload
}) {



    return (
        <div className="w-full font-mono relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">LOGISTICS HISTORY & ARCHIVE LOGS</h2>
                    <p className="text-[11px] text-slate-500">View your trip history, and export your data parameters.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleBackupDownload}
                        className="border border-emerald-800 text-emerald-400 font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all bg-slate-950 hover:border-emerald-600/50 stims-hover-glow text-center inline-block cursor-pointer"
                    >
                        💾 Backup Data
                    </button>


                </div>
            </div>


        </div>
    );
}