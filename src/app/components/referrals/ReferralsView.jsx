// src/app/components/referrals/ReferralsView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ReferralLinkCard from './modules/ReferralLinkCard';
import ReferralPayoutHub from './modules/ReferralPayoutHub';
import ReferralEarningsHistory from './modules/ReferralEarningsHistory';
import ReferralWithdrawHistory from './modules/ReferralWithdrawHistory';

export default function ReferralsView({ user }) {
    const [referrals, setReferrals] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [availableBalanceCents, setAvailableBalanceCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const fetchReferralData = async () => {
        const currentUserId = user?.id || user?.user?.id;
        if (!currentUserId) return;

        try {
            // FIXED QUERY CHANNELS: Pulling histories straight from our custom audit log trackers
            const [refResponse, ledgerResponse, withdrawalsResponse] = await Promise.all([
                supabase.from('referrals')
                    .select('*')
                    .eq('referrer_id', currentUserId)
                    .order('created_at', { ascending: false }),
                supabase.from('referral_payouts_ledger')
                    .select('amount_cents, payout_status')
                    .eq('referrer_id', currentUserId),
                supabase.from('referral_payouts_withdrawals')
                    .select('*')
                    .eq('referrer_id', currentUserId)
                    .order('created_at', { ascending: false })
            ]);

            if (refResponse.error) throw refResponse.error;
            if (ledgerResponse.error) throw ledgerResponse.error;
            if (withdrawalsResponse.error) throw withdrawalsResponse.error;

            setReferrals(refResponse.data || []);
            setWithdrawals(withdrawalsResponse.data || []);

            // Calculate precise remaining unpaid currency pool balances directly from ledger
            const totalUnpaidCents = (ledgerResponse.data || [])
                .filter(row => row.payout_status === 'unpaid')
                .reduce((sum, row) => sum + row.amount_cents, 0);

            setAvailableBalanceCents(totalUnpaidCents);
        } catch (err) {
            console.error('[STIMS FETCH EXCEPTION]:', err.message);
            setStatusMessage({ type: 'error', text: 'Could not load your history logs.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const targetId = user?.id || user?.user?.id;
        if (targetId) {
            fetchReferralData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="text-center py-12 text-[11px] text-slate-600 tracking-widest uppercase font-mono">
                Loading data...
            </div>
        );
    }

    // src/app/components/referrals/ReferralsView.jsx
    // ... (keep top imports and state loading hooks exactly the same)

    return (
        <div className="w-full space-y-6 animate-fade-in font-mono">
            {statusMessage.text && (
                <div className={`p-3 rounded-lg text-xs border ${statusMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-900 text-rose-400'
                    }`}>
                    {statusMessage.text}
                </div>
            )}

            {/* Top Row Split Layout Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <ReferralLinkCard user={user} />
                <ReferralPayoutHub
                    user={user}
                    availableBalanceCents={availableBalanceCents}
                    onPayoutSuccess={fetchReferralData}
                    setStatusMessage={statusMessage => setStatusMessage(statusMessage)}
                />
            </div>

            {/* Bottom Row History Tracking Layout Grid with forced uniform stretch constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <ReferralEarningsHistory referrals={referrals} />
                <ReferralWithdrawHistory withdrawals={withdrawals} />
            </div>
        </div>
    );
}
