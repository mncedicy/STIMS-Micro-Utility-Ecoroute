// src\app\components\fleet\FleetHeader.jsx

'use client';

import React, { useState } from 'react';

export default function FleetHeader({
    freeTierLimitReached,
    handleBackupDownload,
    handleAddNewVehicleClick,
    handleUpgradePlanAction,
    isPending
}) {
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

    const onAddVehicleClickInternal = () => {
        if (freeTierLimitReached) {
            setIsLimitModalOpen(true);
        } else {
            handleAddNewVehicleClick();
        }
    };

    const onUpgradeClickInternal = () => {
        setIsLimitModalOpen(false);
        handleUpgradePlanAction();
    };

    return (
        <div className="w-full font-mono relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">FLEET METRICS & ARCHIVE LOGS</h2>
                    <p className="text-[11px] text-slate-500">View your trip history, inspect vehicles, and export your data parameters.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleBackupDownload}
                        className="border border-emerald-800 text-emerald-400 font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all bg-slate-950 hover:border-emerald-600/50 stims-hover-glow text-center inline-block cursor-pointer"
                    >
                        💾 Backup Data
                    </button>

                    <button
                        type="button"
                        onClick={onAddVehicleClickInternal}
                        className={`border border-transparent text-white font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all stims-hover-glow cursor-pointer ${freeTierLimitReached ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-blue-600'
                            }`}
                    >
                        {freeTierLimitReached ? '🔒 Limit Reached' : '[+] Add New Vehicle'}
                    </button>
                </div>
            </div>

            {/* FIXED SYSTEM OVERLAY BACKDROP: Clean flexbox layout alignment with w-screen removed */}
            {isLimitModalOpen && (
                <div className="fixed inset-0 z-50 h-screen flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-100">

                    {/* FLAT CONTAINER CARD */}
                    <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 stims-hover-glow text-left">
                        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">VEHICLE REGISTRY LIMIT</h4>
                        </div>
                        <div className="text-xs space-y-2 text-slate-400 leading-relaxed">
                            <p className="font-bold text-slate-200 text-sm">Free plans are limited to 1 vehicle entry.</p>
                            <p>To track unlimited fleet assets, analyze trends, and unlock print certificates, please upgrade your utility profile tier.</p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 text-[10px]">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={onUpgradeClickInternal}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold py-2.5 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 cursor-pointer text-center"
                            >
                                {isPending ? "Connecting..." : "⭐ Upgrade to Pro (R280 per month)"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsLimitModalOpen(false)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded transition-colors uppercase tracking-wider cursor-pointer text-center"
                            >
                                Close Panel
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
