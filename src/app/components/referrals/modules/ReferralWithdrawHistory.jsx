// src/app/components/referrals/modules/ReferralWithdrawHistory.jsx
'use client';

import React, { useState } from 'react';

export default function ReferralWithdrawHistory({ withdrawals = [] }) {
    const [filter, setFilter] = useState('all');

    const filteredWithdrawals = withdrawals.filter(w => {
        if (filter === 'all') return true;
        return w.status === filter;
    });

    return (
        <div className="stims-panel-card stims-hover-glow transition-all duration-300 space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-2 shrink-0">
                <span className="stims-label mb-0">CASH WITHDRAWAL TRACKING TRACE</span>

                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px]">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-2.5 py-1 rounded cursor-pointer font-mono uppercase tracking-wide transition-all ${filter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        ALL ({withdrawals.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('processing')}
                        className={`px-2.5 py-1 rounded cursor-pointer font-mono uppercase tracking-wide transition-all ${filter === 'processing' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        PENDING
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('success')}
                        className={`px-2.5 py-1 rounded cursor-pointer font-mono uppercase tracking-wide transition-all ${filter === 'success' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        CLEARED
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('failed')}
                        className={`px-2.5 py-1 rounded cursor-pointer font-mono uppercase tracking-wide transition-all ${filter === 'failed' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        FAILED
                    </button>
                </div>
            </div>

            {/* FIXED HEIGH SCROLL CONTAINER: Min height ~2 rows, max height ~5 rows */}
            <div className="overflow-y-auto scrollbar-none space-y-2 pr-1 min-h-[140px] max-h-[340px] flex-grow">
                {filteredWithdrawals.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[140px]">
                        <p className="text-xs text-slate-600 font-mono text-center uppercase">
                            NO TRANSACTION LOGS MATCHING THIS FILTER.
                        </p>
                    </div>
                ) : (
                    filteredWithdrawals.map((row) => (
                        <div key={row.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex flex-col justify-center space-y-1.5 min-h-[58px]">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-slate-300 font-bold uppercase tracking-wide">{row.bank_name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        Acc: ••••{row.account_number?.slice(-4)} • {new Date(row.created_at).toLocaleDateString('en-ZA')}
                                    </p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-white font-bold tracking-tight">R{(row.amount_cents / 100).toFixed(2)}</p>
                                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider block border text-center ${row.status === 'success'
                                        ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                        : row.status === 'processing'
                                            ? 'bg-amber-950/40 border-amber-900/30 text-amber-400'
                                            : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                                        }`}>
                                        {row.status === 'success' ? 'CLEARED' : row.status}
                                    </span>
                                </div>
                            </div>

                            {row.status === 'failed' && row.failure_reason && (
                                <div className="text-[10px] text-rose-400 bg-rose-950/10 border border-rose-950/30 p-2 rounded leading-relaxed font-sans normal-case">
                                    ❌ DECLINE TRACE METADATA: {row.failure_reason}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
