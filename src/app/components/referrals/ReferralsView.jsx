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
    const [ledger, setLedger] = useState([]);
    const [availableBalanceCents, setAvailableBalanceCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const fetchReferralData = async () => {
        // Enforce parsing matching your global user model criteria parameters path keys
        const currentUserId = user?.id || user?.user?.id;
        if (!currentUserId) return;

        try {
            const [refResponse, ledgerResponse] = await Promise.all([
                supabase.from('referrals')
                    .select('*')
                    .eq('referrer_id', currentUserId),
                supabase.from('referral_payouts_ledger')
                    .select('*')
                    .eq('referrer_id', currentUserId)
            ]);

            if (refResponse.error) throw refResponse.error;
            if (ledgerResponse.error) throw ledgerResponse.error;

            const ledgerRows = ledgerResponse.data || [];
            setReferrals(refResponse.data || []);
            setLedger(ledgerRows);

            // Calculate precise unpaid balances inside ledger row logs array
            const totalUnpaidCents = ledgerRows
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

            {/* Top row split layout for Link and Cashout Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <ReferralLinkCard user={user} />
                <ReferralPayoutHub
                    user={user}
                    availableBalanceCents={availableBalanceCents}
                    onPayoutSuccess={fetchReferralData}
                    setStatusMessage={setStatusMessage}
                />
            </div>

            {/* Separate cards stacked below for history files */}
            <ReferralEarningsHistory referrals={referrals} />
            <ReferralWithdrawHistory ledger={ledger} />
        </div>
    );
}
