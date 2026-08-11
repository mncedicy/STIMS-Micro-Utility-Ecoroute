// /src/app/components/dashboard/SubscriptionCard.jsx
'use client';

import React from 'react';

export default function SubscriptionCard({
    isActivePremium,
    subscription,
    customVehicles,
    isPending,
    onPayClick,
    onCancelPromptClick
}) {
    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow font-mono text-xs transition-all duration-300 text-left">
            <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">ECO INTELLIGENCE LICENSE DETAILS</h3>
                <span className="text-[10px] text-slate-500">SYSTEM STATUS</span>
            </div>

            {/* Core Metrics Summary Grid Block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1">ACCOUNT TIER</span>
                    <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                        {isActivePremium ? 'premium' : 'free'} plan
                    </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1">PLAN STATUS</span>
                    <span className={`text-sm font-bold uppercase ${isActivePremium ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {subscription?.status || 'inactive'}
                    </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                    <span className="text-slate-500 text-[10px] block mb-1">ADDED VEHICLES</span>
                    <span className="text-sm font-bold text-blue-400">{customVehicles.length} vehicles</span>
                </div>
            </div>

            {/* Calendar Billing Timeline Information Strip */}
            {subscription?.current_period_end && subscription.status === 'active' && (
                <div className="mb-4 text-[11px] text-slate-400 bg-slate-950/20 border border-slate-800/40 p-2.5 rounded-lg flex justify-between items-center">
                    <span>📅 NEXT RECURRING BILLING CYCLE:</span>
                    <span className="font-bold text-slate-300">
                        {new Date(subscription.current_period_end).toLocaleDateString('en-ZA')}
                    </span>
                </div>
            )}

            {/* Historical Cancellation Reasoning Explanation Prompt */}
            {subscription?.cancel_reason && subscription.status === 'cancelled' && (
                <div className="mb-4 text-[11px] text-rose-400 bg-rose-950/10 border border-rose-950/30 p-2.5 rounded-lg">
                    ℹ️ CANCELLATION INSIGHT: {subscription.cancel_reason}
                </div>
            )}

            {/* Action Row Trigger Controls Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60 pt-3">
                <p className="text-slate-500 text-[11px] text-center sm:text-left normal-case font-sans">
                    Premium unlocks flights, shipping calculators, and lets you add unlimited cars.
                </p>
                <div className="flex space-x-2 w-full sm:w-auto shrink-0 justify-end items-center">
                    {!isActivePremium ? (
                        <button
                            type="button"
                            onClick={onPayClick}
                            disabled={isPending}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 animate-pulse cursor-pointer stims-hover-glow"
                        >
                            {isPending ? "Connecting..." : "⭐ Upgrade to Pro (R280 per month)"}
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
        </div>
    );
}
