// src/app/components/referrals/modules/ReferralHistoryLedger.jsx
'use client';

import React, { useState } from 'react';

export default function ReferralHistoryLedger({ referrals = [], ledger = [] }) {
    const [activeTab, setActiveTab] = useState('conversions'); // 'conversions' or 'payouts'

    return (
        <div className="stims-panel-card space-y-4">
            {/* Tab Controller Strip Switcher */}
            <div className="flex border-b border-slate-900 pb-2 gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('conversions')}
                    className={`text-[10px] font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === 'conversions'
                        ? 'text-blue-500 border-blue-500'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                        }`}
                >
                    Conversions ({referrals.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('payouts')}
                    className={`text-[10px] font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === 'payouts'
                        ? 'text-blue-500 border-blue-500'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                        }`}
                >
                    Payout Logs ({ledger.length})
                </button>
            </div>

            {/* Content Windows Wrapper */}
            <div className="overflow-y-auto scrollbar-none max-h-72 space-y-2">

                {/* 1. Tracked Conversions Node Grid */}
                {activeTab === 'conversions' && (
                    referrals.length === 0 ? (
                        <p className="text-xs text-slate-600 font-mono py-4 text-center">
                            NO SIGNUPS LINKED TO YOUR TRACKING URL YET.
                        </p>
                    ) : (
                        referrals.map((ref) => (
                            <div key={ref.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">
                                        {ref.app_id} Module
                                    </span>
                                    <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${ref.status === 'active'
                                        ? 'bg-blue-950/50 text-blue-400 border-blue-900/40'
                                        : 'bg-slate-900 text-slate-500 border-slate-800'
                                        }`}>
                                        {ref.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-900/40">
                                    <span>Cycles Credited: <strong className="text-slate-300">{ref.credits_earned_count}</strong></span>
                                    <span>Linked: {new Date(ref.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* 2. Historical Ledger Payout Lines Grid */}
                {activeTab === 'payouts' && (
                    ledger.length === 0 ? (
                        <p className="text-xs text-slate-600 font-mono py-4 text-center">
                            NO PAYOUT TRANSACTIONS FOUND IN THIS SPECIFIED NODE.
                        </p>
                    ) : (
                        ledger.map((row) => (
                            <div key={row.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-slate-300 font-medium">Commission Distribution</p>
                                    <p className="text-[9px] text-slate-600">
                                        Ref: #{row.id} • {new Date(row.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-white font-bold tracking-wide">
                                        R{(row.amount_cents / 100).toFixed(2)}
                                    </p>
                                    <span className={`text-[8px] uppercase tracking-tighter px-1.5 py-0.5 rounded font-bold ${row.payout_status === 'paid'
                                        ? 'bg-emerald-950/60 border border-emerald-900/40 text-emerald-400'
                                        : 'bg-amber-950/60 border border-amber-900/40 text-amber-400'
                                        }`}>
                                        {row.payout_status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )
                )}

            </div>
        </div>
    );
}
