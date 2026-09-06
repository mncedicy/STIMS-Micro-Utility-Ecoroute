// src/app/components/referrals/ReferralsViewContainer.jsx
'use client';

import React from 'react';
import ReferralsView from './ReferralsView';
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions';

export default function ReferralsViewContainer({
    user,
    isPremium,
    subscription,
    errorMsg
}) {
    // Destructure the global action button hook for upselling standard upgrades
    const { isPending, handlePrimaryClickButton: upgradePlan } = useSubscriptionActions(user, subscription);

    return (
        <div className="space-y-6 w-full animate-fade-in font-mono">
            {/* 1. Global System Telemetry Diagnostics Header Alerts */}
            {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-lg shadow-sm">
                    ⚠️ SYSTEM LOG ALERT: {errorMsg}
                </div>
            )}

            {/* 2. GATE MODULE: If user is not premium, block view and show premium prompt */}
            {!isPremium ? (
                <div className="stims-panel-card text-center py-12 max-w-2xl mx-auto space-y-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-10 w-10 bg-blue-950/60 text-blue-400 border border-blue-900/40 flex items-center justify-center rounded-xl font-bold text-lg select-none">
                            🔒
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-2">
                            Affiliate Program Restricted
                        </h3>
                        <p className="text-xs text-slate-500 font-sans max-w-md leading-relaxed">
                            The STIMS high-yield revenue referral engine is configured strictly for enterprise tier or premium accounts. Upgrade your active route clearance to unlock cashouts.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 max-w-xs mx-auto">
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={upgradePlan}
                            className="w-full stims-btn-primary cursor-pointer"
                        >
                            {isPending ? 'SYNCHRONIZING...' : '👑 UPGRADE TO PREMIUM TIER'}
                        </button>
                    </div>
                </div>
            ) : (
                /* 3. CORE SECURE LAYER: If premium check passes, mount the full management view */
                <ReferralsView user={user} />
            )}
        </div>
    );
}
