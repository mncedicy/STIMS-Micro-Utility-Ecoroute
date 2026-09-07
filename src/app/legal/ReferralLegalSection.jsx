// src/app/legal/ReferralLegalSection.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ReferralLegalSection() {
    // Dynamic rules state mirroring live app parameters natively
    const [rules, setRules] = useState({ commission: 10, limit: 1 });

    useEffect(() => {
        async function fetchAppRules() {
            try {
                const { data, error } = await supabase
                    .from('applications')
                    .select('referral_commission_percentage, referral_reward_limit_count')
                    .eq('app_id', 'ecoroute')
                    .maybeSingle();

                if (!error && data) {
                    setRules({
                        commission: data.referral_commission_percentage || 10,
                        limit: data.referral_reward_limit_count || 1
                    });
                }
            } catch (err) {
                console.error('Failed to load dynamic terms variables:', err);
            }
        }
        fetchAppRules();
    }, []);

    return (
        <div className="space-y-2 font-mono text-xs border-t border-slate-900 pt-4">
            <h4 className="text-emerald-400 font-bold uppercase text-[11px] tracking-wide">
                6.0 High-Yield Affiliate & Referral Program Terms
            </h4>
            <p className="text-slate-200">
                By participating in the STIMS EcoRoute affiliate program and sharing your custom referral URL, you agree to the following rules. These terms are absolute and enforced automatically at the database level:
            </p>

            <div className="space-y-2 mt-2 pl-2 border-l border-slate-800 text-slate-400">
                <p>
                    <strong className="text-slate-100 font-bold">6.1 Payout Limit Caps:</strong> Commissions only apply to the initial subscription payment count limit configured for each application layout in our database rules. Payout cycles stop generating once the threshold limit of <strong className="text-blue-400">{rules.limit} {rules.limit === 1 ? 'payment' : 'payments'}</strong> per friend is reached.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold">6.2 One-Time Credit Rule:</strong> Referral pathways are credited on a one-time basis per referred account entity. If a referred friend cancels their plan and resubscribes again later, no duplicate commissions or extra tracking credits will be assigned to your ledger balance. When active, you earn a <strong className="text-emerald-400">{rules.commission}% cash commission</strong> from their premium subscription payment.
                </p>
                <p className="text-rose-400">
                    <strong className="text-slate-100 font-bold">6.3 Active Account & Forfeiture Policy:</strong> You must maintain an active Premium Pro plan. If your subscription is cancelled, expires, or drops to the free tier for any reason, all unpaid earnings waiting in your balance queues, as well as all active reference links and historical referral tracking records, are permanently lost, cleared, and forfeited instantly.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold">6.4 Link Tracking Protocol:</strong> Invited friends must register explicitly using your exact referral tracking URL link format or supply your registered email profile index if prompted during signup. Typo entries or missed tracking connections cannot be corrected or credited manually.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold">6.5 Bank Account Identity Matching:</strong> For security compliance, the account holder name submitted on your Paystack disbursement profile must match your registered account identity. Payments sent to accounts with mismatched names will be rejected by our banking gateways.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold">6.6 Settlement Delivery Window:</strong> Once a withdrawal request is successfully initiated via the dashboard balance portal, please allow a processing window of exactly 2 to 3 business days for funds to clear.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold">6.7 Minimum Withdrawal Threshold:</strong> Payout requests are subject to a minimum cashout limit constraint of <strong className="font-mono text-slate-100">R100.00 ZAR</strong>. Balance values below this number cannot be extracted.
                </p>
            </div>
        </div>
    );
}
