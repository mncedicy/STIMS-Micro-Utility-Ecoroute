'use client';

import React, { useState } from 'react';
import Header from './Header';
import DispatchForm from './DispatchForm';
import Ledger from './Ledger';

export default function DashboardView({
    user,
    profile,
    isPremium,
    quotaReached,
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle,
    distance,
    setDistance,
    unit,
    setUnit,
    estimate,
    calcLoading,
    errorMsg,
    handleCalculate,
    subscription,
    loadData
}) {
    const [isPending, setIsPending] = useState(false);


    const handleCancelSubscription = async () => {
        if (!window.confirm("Are you sure you want to terminate your premium plan contract?")) return;
        setIsPending(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_PAYSTACK_CANCEL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    appId: "ecoroute",
                })
            });

            const cancelResult = await response.json();

            if (response.ok && cancelResult.success) {
                alert("Cancellation command pushed to Paystack. Syncing changes locally...");
                setTimeout(async () => {
                    await loadData();
                }, 2500);
            } else {
                throw new Error(cancelResult.error || "Could not complete authorization steps.");
            }
        } catch (err) {
            console.error(err);
            alert("Cancellation Fault Trace Warning: " + err.message);
        } finally {
            setIsPending(false);
        }
    };

    const handlePay = async () => {
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
                window.location.href = sessionData.url;
            } else {
                throw new Error(sessionData.error || "Could not resolve processing gateway authorization session link.");
            }
        } catch (err) {
            console.error(err);
            alert("Payment infrastructure authorization fault: " + err.message);
        } finally {
            setIsPending(false);
        }
    };



    // Derived active evaluation state metrics
    const isActivePremium = subscription && subscription.status === 'active' && subscription.tier === 'premium';

    return (
        <div className="space-y-6 w-full animate-fade-in">
            {quotaReached && (
                <div className="p-3 bg-amber-950/30 border border-amber-900/40 text-amber-400 text-xs rounded-xl font-mono animate-pulse">
                    ⚠️ COMPLIANCE ADVISORY: Fleet entry caps reached for free plan level configurations. Upgrade to register unlimited trucks.
                </div>
            )}

            <Header
                user={user}
                profile={profile}
                isPremium={isActivePremium}
                quotaReached={quotaReached}
                onSuccess={loadData}
            />

            {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
                    ⚠️ SYSTEM LOG alert: {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <DispatchForm
                    distance={distance}
                    setDistance={setDistance}
                    unit={unit}
                    setUnit={setUnit}
                    onSubmit={handleCalculate}
                    loading={calcLoading}
                    customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle}
                    setSelectedCustomVehicle={setSelectedCustomVehicle}
                />

                <Ledger estimate={estimate} isPremium={isActivePremium} />
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow font-mono text-xs transition-all duration-300">
                <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">ECO INTELLIGENCE LICENSE DETAILS</h3>
                    <span className="text-[10px] text-slate-500">SYSTEM STATUS</span>
                </div>

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

                {/* Dynamic billing coverage expiration info block */}
                {subscription?.current_period_end && subscription.status === 'active' && (
                    <div className="mb-4 text-[11px] text-slate-400 bg-slate-950/20 border border-slate-800/40 p-2.5 rounded-lg flex justify-between items-center">
                        <span>📅 NEXT RECURRING BILLING CYCLE:</span>
                        <span className="font-bold text-slate-300">{new Date(subscription.current_period_end).toLocaleDateString('en-ZA')}</span>
                    </div>
                )}

                {subscription?.cancel_reason && subscription.status === 'cancelled' && (
                    <div className="mb-4 text-[11px] text-rose-400 bg-rose-950/10 border border-rose-950/30 p-2.5 rounded-lg">
                        ℹ️ CANCELLATION INSIGHT: {subscription.cancel_reason}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60 pt-3">
                    <p className="text-slate-500 text-[11px] text-center sm:text-left">Premium unlocks flights, shipping calculators, and lets you add unlimited cars.</p>
                    <div className="flex space-x-2 w-full sm:w-auto shrink-0 justify-end items-center">
                        {!isActivePremium ? (
                            <button
                                onClick={handlePay}
                                disabled={isPending}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-blue-600/10 disabled:opacity-40 animate-pulse cursor-pointer stims-hover-glow"
                            >
                                {isPending ? "Connecting..." : "⭐ Upgrade to Pro (R280 per month)"}
                            </button>
                        ) : (
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isPending}
                                className="bg-slate-950 border border-red-950/40 hover:border-red-900/60 text-red-400 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer stims-hover-glow"
                            >
                                {isPending ? "Cancelling..." : "🚫 Cancel Pro Subscription"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
