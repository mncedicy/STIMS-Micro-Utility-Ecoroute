// src/app/components/referrals/modules/ReferralPayoutHub.jsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function ReferralPayoutHub({
    user,
    availableBalanceCents,
    onPayoutSuccess,
    setStatusMessage
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [bankAccount, setBankAccount] = useState({ bankCode: '', accountNum: '' });

    const availableZar = availableBalanceCents / 100;
    const MINIMUM_CASHOUT_ZAR = 100;
    const isBelowMinimum = availableZar < MINIMUM_CASHOUT_ZAR;

    const handleExecuteCashout = async (e) => {
        e.preventDefault();
        if (availableZar <= 0 || isBelowMinimum || !bankAccount.bankCode || !bankAccount.accountNum) return;

        setIsProcessing(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const { error } = await supabase
                .from('referral_payouts_ledger')
                .update({ payout_status: 'paid', updated_at: new Date().toISOString() })
                .eq('referrer_id', user.id)
                .eq('payout_status', 'unpaid');

            if (error) throw error;

            setStatusMessage({
                type: 'success',
                text: `Withdrawal successful: R${availableZar.toFixed(2)} sent for payment processing.`
            });

            setBankAccount({ bankCode: '', accountNum: '' });
            if (typeof onPayoutSuccess === 'function') onPayoutSuccess();
        } catch (err) {
            setStatusMessage({ type: 'error', text: `Could not withdraw funds: ${err.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="stims-panel-card stims-hover-glow transition-all duration-300 h-full flex flex-col justify-between space-y-4">
            <div>
                <span className="stims-label">AVAILABLE BALANCES PORTAL</span>
                <div className="flex items-baseline space-x-1.5 my-1">
                    <span className="text-xs text-slate-500 font-bold font-mono">R</span>
                    <span className="text-3xl font-bold font-mono text-white tracking-tight">
                        {availableZar.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">ZAR AVAILABLE</span>
                </div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-900/60 text-[11px] text-slate-400 font-sans leading-relaxed">
                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">👤</span>
                        <p><strong className="text-slate-300">Bank Owner Name:</strong> The bank account must belong to you. Paystack will reject payouts sent to a bank account with a different name.</p>
                    </div>

                    <div className="flex items-start space-x-1.5">
                        <span className="shrink-0 mt-0.5">⏳</span>
                        <p><strong className="text-slate-300">Payout Delay:</strong> Withdrawals take <strong className="text-slate-300">2 to 3 business days</strong> to clear into your bank account.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleExecuteCashout} className="space-y-3 pt-2 flex-grow flex flex-col justify-end">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                    PAYSTACK BANK DISBURSEMENT
                </span>

                <div>
                    <label className="stims-label text-[9px]">Select Your Bank</label>
                    <select
                        required
                        value={bankAccount.bankCode}
                        onChange={(e) => setBankAccount({ ...bankAccount, bankCode: e.target.value })}
                        className="stims-select cursor-pointer"
                    >
                        <option value="">-- CHOOSE BANK --</option>
                        <option value="fnb">First National Bank (FNB)</option>
                        <option value="standard">Standard Bank</option>
                        <option value="abs">ABSA</option>
                        <option value="nedbank">Nedbank</option>
                        <option value="capitec">Capitec</option>
                        <option value="tyme">TymeBank</option>
                    </select>
                </div>

                <div>
                    <label className="stims-label text-[9px]">Account Number</label>
                    <input
                        type="text"
                        required
                        pattern="\d*"
                        placeholder="e.g. 62012345678"
                        value={bankAccount.accountNum}
                        onChange={(e) => setBankAccount({ ...bankAccount, accountNum: e.target.value.replace(/\D/g, '') })}
                        className="stims-input font-mono"
                    />
                </div>

                {availableZar > 0 && isBelowMinimum && (
                    <p className="text-[10px] text-amber-500 font-sans leading-snug pt-1">
                        ⚠️ Minimum withdrawal amount is <strong className="font-mono">R{MINIMUM_CASHOUT_ZAR}.00</strong>. Please save up more earnings before cashing out.
                    </p>
                )}

                <button
                    type="submit"
                    disabled={availableZar <= 0 || isBelowMinimum || isProcessing || !bankAccount.bankCode || !bankAccount.accountNum}
                    className={`w-full stims-btn-primary cursor-pointer mt-2 ${(availableZar <= 0 || isBelowMinimum) ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                >
                    {isProcessing ? 'PROCESSING...' : 'WITHDRAW ALL FUNDS'}
                </button>
            </form>
        </div>
    );
}
