'use client';

import React, { useState } from 'react';
import Header from './Header';
import DispatchForm from './DispatchForm';
import Ledger from './Ledger';
import { supabase } from '../lib/supabaseClient';

export default function DashboardView({
    user, profile, isPremium, quotaReached, customVehicles, selectedCustomVehicle, setSelectedCustomVehicle, distance, setDistance, unit, setUnit, estimate, calcLoading, errorMsg, handleCalculate, subscription, loadData, setIsFleetModalOpen
}) {
    const [isPending, setIsPending] = useState(false);

    const handleCancelSubscription = async () => {
        if (!window.confirm("Are you sure you want to cancel your subscription?")) return;
        setIsPending(true);
        try {
            const { error } = await supabase
                .from('user_subscriptions')
                .update({ status: 'cancelled' })
                .eq('user_id', user.id)
                .eq('app_id', 'ecoroute');
            if (error) throw error;
            await loadData();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsPending(false);
        }
    };

    // MODIFIED: Pointed the fetch path and body variables to match your exact Paystack API route requirements
    const handlePay = async () => {
        setIsPending(true);
        try {
            const response = await fetch('/api/checkout/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userEmail: user?.email,
                    name: profile?.first_name,
                    surname: profile?.surname,
                    company: profile?.company
                })
            });

            const sessionData = await response.json();

            if (sessionData.url) {
                window.location.href = sessionData.url;
            } else {
                throw new Error(sessionData.error || "Could not load the payment page.");
            }
        } catch (err) {
            console.error(err);
            alert("Payment screen error: " + err.message);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6 w-full animate-fade-in">
            <Header
                user={user}
                profile={profile}
                isPremium={isPremium}
                quotaReached={quotaReached}
                onSuccess={loadData}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <DispatchForm distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit} onSubmit={handleCalculate} loading={calcLoading} errorMsg={errorMsg} customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle} />
                <Ledger estimate={estimate} isPremium={isPremium} />
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl stims-hover-glow font-mono text-xs transition-all duration-300">
                <div className="border-b border-slate-800 pb-2.5 mb-4 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold">ECO INTELLIGENCE LICENSE DETAILS</h3>
                    <span className="text-[10px] text-slate-500">SYSTEM STATUS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                        <span className="text-slate-500 text-[10px] block mb-1">ACCOUNT TIER</span>
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">{subscription.tier} plan</span>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                        <span className="text-slate-500 text-[10px] block mb-1">PLAN STATUS</span>
                        <span className={`text-sm font-bold uppercase ${subscription.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{subscription.status}</span>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg">
                        <span className="text-slate-500 text-[10px] block mb-1">ADDED VEHICLES</span>
                        <span className="text-sm font-bold text-blue-400">{customVehicles.length} vehicles</span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60 pt-3">
                    <p className="text-slate-500 text-[11px] text-center sm:text-left">Premium unlocks flights, shipping calculators, and lets you add unlimited cars.</p>
                    <div className="flex space-x-2 w-full sm:w-auto shrink-0 justify-end items-center">
                        {!isPremium ? (
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
