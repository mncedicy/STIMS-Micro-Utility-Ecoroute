// src/app/components/referrals/modules/ReferralWithdrawHistory.jsx
'use client';

import React from 'react';

export default function ReferralWithdrawHistory({ ledger = [] }) {
    return (
        <div className="stims-panel-card stims-hover-glow transition-all duration-300 space-y-4">
            <div className="border-b border-slate-900 pb-2">
                <span className="stims-label">WITHDRAWS HISTORY LOGS</span>
            </div>

            <div className="overflow-y-auto scrollbar-none max-h-60 space-y-2">
                {ledger.length === 0 ? (
                    <p className="text-xs text-slate-600 font-mono py-4 text-center">
                        YOU HAVE NOT MADE ANY WITHDRAWALS YET.
                    </p>
                ) : (
                    ledger.map((row) => (
                        <div key={row.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex justify-between items-center">
                            <div>
                                <p className="text-slate-300 font-medium">Money Earned</p>
                                <p className="text-[9px] text-slate-600">ID: #{row.id} • {new Date(row.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-white font-bold">R{(row.amount_cents / 100).toFixed(2)}</p>
                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider block border ${row.payout_status === 'paid'
                                    ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                    : 'bg-amber-950/40 border-amber-900/30 text-amber-400'
                                    }`}>
                                    {row.payout_status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
