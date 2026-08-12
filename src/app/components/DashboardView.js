// /src/app/components/DashboardView.jsx
'use client';

import React, { useState } from 'react';
import Header from './Header';
import DispatchForm from './DispatchForm';
import Ledger from './Ledger';
import SubscriptionCard from './dashboard/SubscriptionCard'; // Imported new modular card element
import SystemDialogModal from './SystemDialogModal'; // Imported custom modal layout view

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

    // Controlled parameters modal layout state registry handles
    const [modal, setModal] = useState({
        isOpen: false,
        status: 'blue',
        title: '',
        message: '',
        hasCancel: false
    });

    const executeCancelSubscriptionRoutine = async () => {
        // Clear open modal layer view state flags instantly
        setModal(prev => ({ ...prev, isOpen: false }));
        setIsPending(true);
        try {
            // FIXED: Directly target local route src/app/api/checkout/cancel/route.js
            const response = await fetch('/api/checkout/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id
                })
            });

            const cancelResult = await response.json();

            if (response.ok && cancelResult.success) {
                // FIXED WORKFLOW: Display a clean confirmation notification modal upon success submittal
                setModal({
                    isOpen: true,
                    status: 'green',
                    title: 'CANCELLATION REQUEST DISPATCHED',
                    message: 'Your request was sent to Paystack. The system webhook will now process the background parameters and update your dashboard access values locally.',
                    hasCancel: false
                });

                // Allow a safe multi-second window tracker delay before auto-refreshing profile parameters data models lookups
                setTimeout(async () => {
                    await loadData();
                }, 2500);
            } else {
                throw new Error(cancelResult.error || "Could not complete authorization steps.");
            }
        } catch (err) {
            setModal({
                isOpen: true,
                status: 'red',
                title: 'CANCELLATION TERMINATION ERROR',
                message: `FAILED TO CANCEL CONTRACT STATUS: ${err.message}`,
                hasCancel: false
            });
        } finally {
            setIsPending(false);
        }
    };

    const handlePay = async () => {
        setIsPending(true);
        try {
            // FIXED: Directly target local route src/app/api/checkout/initialize/route.js
            const response = await fetch('/api/checkout/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    userEmail: user?.email,
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
            setModal({
                isOpen: true,
                status: 'red',
                title: 'PAYMENT GATEWAY DISRUPTION',
                message: `Failed to initialize authorization session links: ${err.message}`,
                hasCancel: false
            });
        } finally {
            setIsPending(false);
        }
    };

    const isActivePremium = subscription && (subscription.status === 'active' || subscription.status === 'cancelling') && subscription.tier === 'premium';

    return (
        <div className="space-y-6 w-full animate-fade-in text-left">
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
                currentUsage={estimate?.tokenRecord?.current_monthly_usage || 0}
                limitCap={isActivePremium ? 3000 : 100}
            />

            {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
                    ⚠️ SYSTEM LOG alert: {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <DispatchForm
                    distance={distance} setDistance={setDistance}
                    unit={unit} setUnit={setUnit}
                    onSubmit={handleCalculate} loading={calcLoading}
                    customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle}
                    setSelectedCustomVehicle={setSelectedCustomVehicle}
                />

                <Ledger estimate={estimate} isPremium={isActivePremium} />
            </div>

            {/* FIXED PLACEMENT: Separated subscription dashboard row layout card view into a dedicated component */}
            <SubscriptionCard
                isActivePremium={isActivePremium}
                subscription={subscription}
                customVehicles={customVehicles}
                isPending={isPending}
                onPayClick={handlePay}
                // FIXED TRIGGER: Replaced native window confirm with your high-utility SystemDialogModal prompt
                onCancelPromptClick={() => setModal({
                    isOpen: true,
                    status: 'blue',
                    title: 'CONFIRM PLAN TERMINATION',
                    message: 'Are you completely sure you want to terminate your premium plan contract renewal? Access to high request capacity limits and Excel batch upload parameters tools will remain active until the end of your current paid billing month.',
                    hasCancel: true
                })}
            />

            {/* Reusable UI Alert Validation Overlay Frame Window */}
            <SystemDialogModal
                isOpen={modal.isOpen}
                status={modal.status}
                title={modal.title}
                message={modal.message}
                confirmText={modal.hasCancel ? "CONFIRM TERMINATION" : "ACKNOWLEDGE"}
                onConfirm={modal.hasCancel ? executeCancelSubscriptionRoutine : () => setModal(prev => ({ ...prev, isOpen: false }))}
                onCancel={modal.hasCancel ? () => setModal(prev => ({ ...prev, isOpen: false })) : null}
            />

        </div>
    );
}
