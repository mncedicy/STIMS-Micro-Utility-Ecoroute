// /src/app/components/FleetView.jsx
'use client';

import React, { useState } from 'react';
import FleetList from './FleetList';
import CarbonChart from './CarbonChart';
import LogHistoryManager from './LogHistoryManager';
import CsvUploader from './CsvUploader';

export default function FleetView({ user, customVehicles = [], rawLogsArray = [], loadData, setIsFleetModalOpen, subscription }) {
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Dynamic initial month date values generation fallback
    const getActiveMonthBoundaries = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const lastDayNode = new Date(year, today.getMonth() + 1, 0).getDate();

        return {
            start: `${year}-${month}-01`,
            end: `${year}-${month}-${String(lastDayNode).padStart(2, '0')}`
        };
    };

    const monthBounds = getActiveMonthBoundaries();

    const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';
    const freeTierLimitReached = !isPremium && customVehicles.length >= 1;

    const handleBackupDownload = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ vehicles: customVehicles, logs: rawLogsArray }, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "ecoroute_backup_ledger.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNewVehicleClick = () => {
        if (freeTierLimitReached) {
            setIsLimitModalOpen(true);
            return;
        }
        setIsFleetModalOpen(true);
    };

    const handleUpgradePlanAction = async () => {
        setIsPending(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_PAYSTACK_INITIALIZE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userEmail: user?.email,
                    appId: "ecoroute",
                    callbackUrl: `${window.location.origin}?stims_app_id=ecoroute`
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const sessionData = await response.json();

            if (sessionData.success && sessionData.url) {
                setIsLimitModalOpen(false);
                window.location.href = sessionData.url;
            } else {
                throw new Error(sessionData.error || "Could not load payment link.");
            }
        } catch (err) {
            console.error(err);
            alert("Payment screen error: " + err.message);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6 w-full font-mono animate-fade-in relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">FLEET METRICS & ARCHIVE LOGS</h2>
                    <p className="text-[11px] text-slate-500">View your trip history, inspect vehicles, and export your data parameters.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                    <button type="button" onClick={handleBackupDownload}
                        className="border border-emerald-800 text-emerald-400 font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all bg-slate-950 hover:border-emerald-600/50 stims-hover-glow text-center inline-block cursor-pointer">💾 Backup Data</button>

                    <button type="button" onClick={handleAddNewVehicleClick} className={`border border-transparent text-white font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-all stims-hover-glow cursor-pointer ${freeTierLimitReached ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-blue-600'}`}>{freeTierLimitReached ? '🔒 Limit Reached' : '[+] Add New Vehicle'}</button>
                </div>
            </div>
            {/* FIXED PLACEMENT: Injected the batch import uploader panel cleanly on top of fleet list registries */}
            <CsvUploader onUploadSuccess={() => loadData(true)} />
            <FleetList customVehicles={customVehicles} onVehicleDeleted={loadData} isPremium={isPremium} />
            <LogHistoryManager user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray} />
            <CarbonChart rawLogsArray={rawLogsArray} />

            {isLimitModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
                    <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto stims-hover-glow transition-all duration-300">
                        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">VEHICLE REGISTRY LIMIT</h4>
                        </div>
                        <div className="text-xs space-y-2 text-slate-400 leading-relaxed">
                            <p className="font-bold text-slate-200 text-sm">Free plans are limited to 1 vehicle entry.</p>
                            <p>To track unlimited fleet assets, analyze trends, and unlock print certificates, please upgrade your utility profile tier.</p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 text-[10px]">
                            <button type="button" disabled={isPending} onClick={handleUpgradePlanAction} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold py-2.5 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 cursor-pointer text-center">
                                {isPending ? "Connecting..." : "⭐ Upgrade to Pro (R280 per month)"}
                            </button>
                            <button type="button" onClick={() => setIsLimitModalOpen(false)} className="w-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded transition-colors uppercase tracking-wider cursor-pointer text-center">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
