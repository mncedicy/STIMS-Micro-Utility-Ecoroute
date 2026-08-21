// src/app/components/home/DashboardView.js

'use client';

import React from 'react';
import Header from './header/Header';
import DispatchForm from './dispatch/DispatchForm';
import Ledger from './ledger/Ledger';
import SubscriptionCard from './subscription/SubscriptionCard';
import SystemDialogModal from '../shared/SystemDialogModal';
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions';

export default function DashboardView({
    user, profile, quotaReached, customVehicles, selectedCustomVehicle,
    setSelectedCustomVehicle, distance, setDistance, unit, setUnit,
    estimate, calcLoading, errorMsg, handleCalculate, subscription, loadData
}) {
    const {
        isPending, modal, setModal, isActivePremium,
        handlePrimaryClickButton, handleCancelPromptClick, handleConfirmModal
    } = useSubscriptionActions(user, subscription, loadData);

    const tokenRecordRow = estimate?.tokenRecord || null;

    return (
        <div className="space-y-6 w-full animate-fade-in text-left">
            {quotaReached && (
                <div className="p-3 bg-amber-950/30 border border-amber-900/40 text-amber-400 text-xs rounded-xl font-mono animate-pulse">
                    ⚠️ COMPLIANCE ADVISORY: Fleet entry caps reached for free plan level configurations. Upgrade to register unlimited trucks.
                </div>
            )}

            <Header
                user={user} profile={profile} isPremium={isActivePremium} quotaReached={quotaReached}
                onSuccess={loadData} currentUsage={tokenRecordRow?.current_monthly_usage || 0}
                limitCap={tokenRecordRow?.usage_limit_cap || (isActivePremium ? 3000 : 100)}
            />

            {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono">
                    ⚠️ SYSTEM LOG: {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <DispatchForm
                    distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit}
                    onSubmit={handleCalculate} loading={calcLoading} customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle}
                    setModal={setModal} // FIXED: Mapped property handle downwards natively
                />
                <Ledger estimate={estimate} isPremium={isActivePremium} />
            </div>

            <SubscriptionCard
                isActivePremium={isActivePremium}
                subscription={subscription}
                tokenRecord={tokenRecordRow}
                customVehicles={customVehicles}
                isPending={isPending}
                onPayClick={handlePrimaryClickButton}
                onCancelPromptClick={handleCancelPromptClick}
            />

            <SystemDialogModal
                isOpen={modal.isOpen} status={modal.status} title={modal.title} message={modal.message}
                confirmText={modal.hasCancel ? (modal.actionType === 'resume' ? "RESUME RENEWALS" : "PROCEED TO CHECKOUT") : "ACKNOWLEDGE"}
                onConfirm={handleConfirmModal} onCancel={modal.hasCancel ? () => setModal(p => ({ ...p, isOpen: false })) : null}
            />
        </div>
    );
}
