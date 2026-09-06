// src/app/components/referrals/modules/ReferralLinkCard.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function ReferralLinkCard({ user }) {
    const [copied, setCopied] = useState(false);
    const [rules, setRules] = useState({ commission: 10, limit: 1 });

    // Dynamic host tracking configuration state with fallback
    const [hostOrigin, setHostOrigin] = useState('https://ecoroute.stims.co.za');

    // Safe dynamic window origin lookup execution block
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHostOrigin(window.location.origin);
        }
    }, []);

    // Exact requested format string assignment 
    const referralUrl = `${hostOrigin}?${user?.email || ''}`;

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
                console.error(err);
            }
        }
        fetchAppRules();
    }, []);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="stims-panel-card stims-hover-glow transition-all duration-300 h-full flex flex-col justify-between">
            <div className="space-y-3 flex-grow">
                <span className="stims-label">YOUR REFERRAL LINK</span>

                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    Copy your unique link below and send it to your friends. When they sign up and subscribe to a paid plan, you will automatically earn a <strong className="text-emerald-400">{rules.commission}% cash commission</strong> from their subscription payment.
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-900/60 text-[11px] text-slate-400 font-sans leading-relaxed">
                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">ℹ️</span>
                        <p><strong className="text-slate-300">Payout Limit:</strong> You earn commission for up to the first <strong className="text-blue-400">{rules.limit} {rules.limit === 1 ? 'payment' : 'payments'}</strong> made by each friend.</p>
                    </div>

                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">⚠️</span>
                        <p><strong className="text-slate-300">One-Time Only:</strong> You only get credited once per friend. If they cancel and subscribe again, you do not get paid twice.</p>
                    </div>

                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">🔒</span>
                        <p><strong className="text-slate-300">Active Account Rule:</strong> You must stay on an active paid plan. <strong className="text-rose-400">If you cancel your plan, all unpaid accumulated earnings are lost instantly.</strong></p>
                    </div>

                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">🔗</span>
                        <p><strong className="text-slate-300">Link Tracking:</strong> Friends must use your exact link or enter your email address if prompted. If they make a typo or forget to use it, you will not get the credit.</p>
                    </div>
                </div>
            </div>

            <div className="pt-2 mt-3 text-[10px] font-sans text-slate-500 border-t border-slate-900/40">
                By sharing your link, you agree to our full terms.
                <a href="/legal" className="text-blue-400 hover:text-blue-300 underline font-mono ml-1 uppercase tracking-wider">
                    See more from T&Cs
                </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch mt-4">
                <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="stims-input flex-1 select-all font-mono text-[11px] bg-slate-950 border-slate-900 px-3 py-2 text-blue-400 rounded-lg"
                />
                <button
                    type="button"
                    onClick={handleCopyLink}
                    className="stims-btn-primary shrink-0 sm:w-28 cursor-pointer space-x-1"
                >
                    <span>📋</span>
                    <span>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
            </div>
        </div>
    );
}
