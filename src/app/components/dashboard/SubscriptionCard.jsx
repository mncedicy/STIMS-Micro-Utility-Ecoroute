// /src/app/components/dashboard/SubscriptionCard.jsx
'use client';

import React from 'react';

export default function SubscriptionCard({
    isActivePremium,
    subscription,
    tokenRecord,
    customVehicles,
    isPending,
    onPayClick,
    onCancelPromptClick
}) {
    const currentSubStatus = (subscription?.status || "").toLowerCase();
    const isCancelling = ['cancelling', 'non-renewing', 'non_renewing'].includes(currentSubStatus);
    const isActuallyActive = currentSubStatus === 'active';

    let remainingDays = 30;
    let formattedExpiryDate = 'End of Cycle';

    if (tokenRecord?.last_reset_period) {
        try {
            const resetDate = new Date(tokenRecord.last_reset_period);
            resetDate.setHours(0, 0, 0, 0);

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            const msDiff = currentDate.getTime() - resetDate.getTime();
            const daysPassed = Math.floor(msDiff / (1000 * 60 * 60 * 24));

            remainingDays = Math.max(0, 30 - daysPassed);

            const expiryTargetDate = new Date(resetDate);
            expiryTargetDate.setDate(expiryTargetDate.getDate() + 30);
            formattedExpiryDate = expiryTargetDate.toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            console.error('[Cycle Math Error]:', err);
        }
    }

    const currentApiUsage = tokenRecord?.current_monthly_usage ?? 0;
    const maxCapacityLimit = tokenRecord?.usage_limit_cap ?? 100;

    const displayTierLabel = (isActivePremium || isCancelling) ? 'PRO PLAN ACTIVE' : 'FREE PLAN';
    const displayStatusLabel = isCancelling ? 'Non-Renewing' : (subscription?.status || 'Inactive');

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow font-mono text-xs transition-all duration-300 text-left">
            <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">ECO INTELLIGENCE LICENSE DETAILS</h3>
                <span className="text-[10px] text-slate-500 font-bold">SYSTEM CONTROLS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">ACCOUNT TIER</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        {displayTierLabel}
                    </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">PLAN STATUS</span>
                    <span className={`text-xs font-bold uppercase ${isCancelling ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {displayStatusLabel}
                    </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">API USAGE VOLUME</span>
                    <span className="text-xs font-bold text-slate-200">
                        {currentApiUsage.toLocaleString('en-ZA')} / {maxCapacityLimit.toLocaleString('en-ZA')} REQ
                    </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">FLEET LOGS</span>
                    <span className="text-xs font-bold text-blue-400 uppercase">{customVehicles.length} Vehicles</span>
                </div>
            </div>

            {isCancelling && (
                <div className="mb-4 text-[11px] p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 border bg-amber-950/20 border-amber-900/40 text-amber-300">
                    <span className="font-bold">
                        ⚠️ Auto-renew disabled. Benefits downgrade to Free tier in <span className="text-white underline font-extrabold">{remainingDays} day(s)</span> on:
                    </span>
                    <span className="font-mono font-bold uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 text-amber-200 text-center shrink-0">
                        {formattedExpiryDate}
                    </span>
                </div>
            )}

            {isActuallyActive && tokenRecord?.last_reset_period && (
                <div className="mb-4 text-[11px] text-2.5 rounded-lg flex justify-between items-center border bg-slate-950/20 border-slate-800/40 text-slate-400 p-2.5">
                    <span>📅 NEXT SCHEDULED AUTO-RENEWAL RESET WINDOW:</span>
                    <span className="font-bold uppercase tracking-wider text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{formattedExpiryDate}</span>
                </div>
            )}

            {subscription?.cancel_reason && (subscription.status === 'cancelled' || isCancelling) && (
                <div className="mb-4 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg italic">
                    ℹ️ REGISTRY TRACKER METADATA: {subscription.cancel_reason}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60 pt-3">
                <p className="text-slate-500 text-[11px] text-center sm:text-left normal-case font-sans">
                    Premium subscription unlocks advanced multi-modal calculation limits.
                </p>
                <div className="flex space-x-2 w-full sm:w-auto shrink-0 justify-end items-center">
                    {!isActuallyActive || isCancelling ? (
                        <button
                            type="button"
                            onClick={onPayClick}
                            disabled={isPending}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 animate-pulse cursor-pointer stims-hover-glow"
                        >
                            {isPending ? "Connecting..." : isCancelling ? "⭐ Start New Subscription Early" : "⭐ Upgrade to Pro (R280/pm)"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onCancelPromptClick}
                            disabled={isPending}
                            className="w-full sm:w-auto bg-slate-950 border border-red-950/40 hover:border-red-900/60 text-red-400 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer stims-hover-glow"
                        >
                            {isPending ? "Processing..." : "🚫 Cancel Pro Subscription"}
                        </button>
                    )}
                </div>
            </div>

            {/* No Refund & Legal Link Footer */}
            <div className="mt-3 pt-2 border-t border-slate-900/40 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-1">
                <span>All purchases are final. No refunds provided.</span>
                <a
                    href="/legal"
                    className="text-blue-400 hover:underline hover:text-blue-300 transition-colors"
                >
                    Terms & Legal Policy
                </a>
            </div>
        </div>
    );
}
