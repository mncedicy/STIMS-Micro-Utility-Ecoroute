// src/app/hooks/useSubscriptionActions.js
'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSubscriptionActions(user, subscription, loadData) {
    const [isPending, setIsPending] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, status: 'blue', title: '', message: '', hasCancel: false, actionType: null });

    const getTargetUser = async () => {
        let targetUserId = user?.id || user?.user?.id;
        let targetUserEmail = user?.email || user?.user?.email;
        if (!targetUserId) {
            const { data: sessionWrapper } = await supabase.auth.getSession();
            targetUserId = sessionWrapper?.session?.user?.id;
            targetUserEmail = sessionWrapper?.session?.user?.email;
        }
        return { targetUserId, targetUserEmail };
    };

    const handlePayOrInitializeTrigger = async () => {
        setModal(p => ({ ...p, isOpen: false }));
        setIsPending(true);
        try {
            const { targetUserId, targetUserEmail } = await getTargetUser();
            if (!targetUserId || !targetUserEmail) throw new Error("Session parameters unresolvable.");

            const response = await fetch('/api/checkout/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, userEmail: targetUserEmail, callbackUrl: `${window.location.origin}?stims_app_id=ecoroute` })
            });
            const data = await response.json();
            if (data.success && data.url) window.location.href = data.url;
            else throw new Error(data.error || "Gateway link failure.");
        } catch (err) {
            setModal({ isOpen: true, status: 'red', title: 'PAYMENT DISRUPTION', message: err.message, hasCancel: false, actionType: null });
        } finally {
            setIsPending(false);
        }
    };

    const executeCancelRoutine = async () => {
        setModal(p => ({ ...p, isOpen: false }));
        setIsPending(true);
        try {
            const { targetUserId } = await getTargetUser();
            const res = await fetch('/api/checkout/cancel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, user_id: targetUserId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setModal({ isOpen: true, status: 'green', title: 'CANCELLATION DISPATCHED', message: 'Auto-renew turned off successfully.', hasCancel: false, actionType: null });
                setTimeout(() => loadData(), 2500);
            } else throw new Error(data.error);
        } catch (err) {
            setModal({ isOpen: true, status: 'red', title: 'CANCELLATION ERROR', message: err.message, hasCancel: false, actionType: null });
        } finally { setIsPending(false); }
    };

    const executeResumeRoutine = async () => {
        setModal(p => ({ ...p, isOpen: false }));
        setIsPending(true);
        try {
            const { targetUserId } = await getTargetUser();
            const res = await fetch('/api/checkout/resume', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, user_id: targetUserId })
            });
            const data = await res.json();

            // FIXED FALLBACK: Catch hard gateway rejections when the contract token is permanently dead
            if (!res.ok || data.error?.toLowerCase().includes('cancelled') || data.error?.toLowerCase().includes('cannot be reactivated')) {
                setModal({
                    isOpen: true,
                    status: 'blue',
                    title: 'RE-INITIALIZING PLAN CONTRACT',
                    message: 'This subscription signature has expired on Paystack. Redirecting you to open a fresh secure checkout portal loop...',
                    hasCancel: false,
                    actionType: null
                });

                // Triggers fresh payment module after short notice reading duration window closes
                setTimeout(() => {
                    handlePayOrInitializeTrigger();
                }, 2000);
                return;
            }

            if (res.ok && data.success) {
                setModal({ isOpen: true, status: 'green', title: 'AUTO-RENEWAL RESUMED', message: 'Your subscription renewal has been successfully re-enabled.', hasCancel: false, actionType: null });
                setTimeout(() => loadData(), 2500);
            } else throw new Error(data.error || 'Failed to resume auto-renewal.');
        } catch (err) {
            setModal({ isOpen: true, status: 'red', title: 'RESUME ERROR', message: err.message, hasCancel: false, actionType: null });
        } finally { setIsPending(false); }
    };

    const rawEndDate = subscription?.current_period_end;
    const expiryDateObj = rawEndDate ? new Date(rawEndDate) : null;
    const isValidDate = expiryDateObj && !isNaN(expiryDateObj.getTime());
    const formattedExpiryDate = isValidDate ? expiryDateObj.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'the end of your billing cycle';

    let remainingDays = 0;
    if (isValidDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDay = new Date(expiryDateObj);
        targetDay.setHours(0, 0, 0, 0);

        const diffTime = targetDay.getTime() - today.getTime();
        remainingDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
    }

    const currentSubStatus = (subscription?.status || "").toLowerCase();
    const isNonRenewing = ['cancelling', 'non-renewing', 'non_renewing'].includes(currentSubStatus);
    const isActivePremium = subscription && ['active', 'cancelling', 'non-renewing', 'non_renewing'].includes(currentSubStatus) && subscription.tier === 'premium';

    const handlePrimaryClickButton = () => {
        if (isNonRenewing) {
            setModal({
                isOpen: true,
                status: 'blue',
                title: 'RESUME AUTO-RENEWAL',
                message: `Your active plan is set to expire on ${formattedExpiryDate} (${remainingDays} days left). Would you like to resume automatic renewals so your plan stays active without extra charges?`,
                hasCancel: true,
                actionType: 'resume'
            });
        } else {
            handlePayOrInitializeTrigger();
        }
    };

    const handleCancelPromptClick = () => {
        setModal({ isOpen: true, status: 'blue', title: 'CONFIRM TERMINATION', message: 'Are you sure you want to stop auto-renewal?', hasCancel: true, actionType: 'cancel' });
    };

    const handleConfirmModal = () => {
        if (modal.actionType === 'cancel') executeCancelRoutine();
        else if (modal.actionType === 'resume') executeResumeRoutine();
        else if (modal.actionType === 'initialize_new') handlePayOrInitializeTrigger();
        else setModal(p => ({ ...p, isOpen: false }));
    };

    return {
        isPending, modal, setModal, isActivePremium, isNonRenewing, remainingDays, formattedExpiryDate,
        handlePrimaryClickButton, handleCancelPromptClick, handleConfirmModal, handlePayOrInitializeTrigger
    };
}
