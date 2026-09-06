'use client';

import React, { useState } from 'react';
import VehicleLimitModal from './VehicleLimitModal';

export default function FleetHeader({
    freeTierLimitReached,
    handleBackupDownload,
    handleAddNewVehicleClick,
    handleUpgradePlanAction,
    isPending, userId
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
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">FLEET METRICS</h2>
                    <p className="text-[11px] text-slate-500">Inspect vehicles, and export your data parameters.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">

                    <a
                        href={`/api/export/vehicles?userId=${userId || ''}`} download
                        className="border border-emerald-800 text-emerald-400 font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all bg-slate-950 hover:border-emerald-600/50 stims-hover-glow text-center inline-block cursor-pointer"                    >
                        💾 Vehicle List</a>

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

            {/* SEPARATED SYSTEM DIALOG MODAL */}
            <VehicleLimitModal
                isOpen={isLimitModalOpen}
                isPending={isPending}
                onUpgrade={onUpgradeClickInternal}
                onCancel={() => setIsLimitModalOpen(false)}
            />
        </div>
    );
}