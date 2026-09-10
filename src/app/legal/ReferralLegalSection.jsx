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
        <div className="space-y-2 font-mono text-xs border-t border-slate-900 pt-4 text-left">
            <h4 className="text-emerald-400 font-bold uppercase text-[11px] tracking-wide">
                6.0 Referral Program Rules
            </h4>
            <p className="text-slate-200">
                By using your custom referral link, you agree to these rules. These rules are final and applied automatically by our system:
            </p>

            <div className="space-y-2 mt-2 pl-2 border-l border-slate-800 text-slate-400 font-sans normal-case leading-relaxed">
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.1 REWARD LIMITS:</strong>
                    You only earn money from your friend's first payments. You stop earning rewards after your friend makes <strong className="text-blue-400">{rules.limit} {rules.limit === 1 ? 'payment' : 'payments'}</strong>. You get a <strong className="text-emerald-400">{rules.commission}% cash reward</strong> from their subscription cost.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.2 ONE-TIME REWARD ONLY:</strong>
                    Each invited account can only reward you once. If your friend cancels their plan and signs up again later, you will not receive a second reward.
                </p>
                <p className="text-rose-400/90">
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.3 ACCOUNT TIER AND LOSS POLICY:</strong>
                    You must keep an active Premium Pro plan to receive your money. If your plan is cancelled, expires, or moves to the free plan, you lose all your unpaid earnings, active links, and referral history forever.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.4 LINK TRACKING RULES:</strong>
                    Your friends must sign up using your exact referral link, or type in your account email address if asked during signup. We cannot fix wrong links or give rewards manually.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.5 BANK NAME CHECKING:</strong>
                    The bank account name you give us for payouts must match the name on your user profile. Payments with wrong names will be rejected by our banking system.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.6 PAYOUT PROCESSING TIME:</strong>
                    Once you ask for a payout through your dashboard, it takes exactly 2 to 3 business days for the money to arrive in your bank account.
                </p>
                <p>
                    <strong className="text-slate-100 font-bold font-mono text-[10px] block mb-0.5">6.7 MINIMUM PAYOUT AMOUNT:</strong>
                    The smallest amount you can withdraw is <strong className="font-mono text-slate-100">R100.00 ZAR</strong>. If your balance is lower than this number, you cannot cash it out.
                </p>
            </div>
        </div>
    );
}
