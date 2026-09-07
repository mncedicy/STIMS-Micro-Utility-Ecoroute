// src/app/components/referrals/modules/ReferralEarningsHistory.jsx
'use client';

import React, { useState } from 'react';

export default function ReferralEarningsHistory({ referrals = [] }) {
    const [filter, setFilter] = useState('all');

    const filteredReferrals = referrals.filter(ref => {
        if (filter === 'all') return true;
        return ref.status === filter;
    });

    return (
        <div className="stims-panel-card stims-hover-glow transition-all duration-300 space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-2 shrink-0">
                <span className="stims-label mb-0">EARNINGS HISTORY FROM SIGNUPS</span>

                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px]">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-2.5 py-1 rounded cursor-pointer ${filter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                        SHOW ALL ({referrals.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('active')}
                        className={`px-2.5 py-1 rounded cursor-pointer ${filter === 'active' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                        ACTIVE
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('completed')}
                        className={`px-2.5 py-1 rounded cursor-pointer ${filter === 'completed' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                        COMPLETED
                    </button>
                </div>
            </div>

            {/* FIXED HEIGH SCROLL CONTAINER CONTAINER: Min height ~2 rows, max height ~5 rows */}
            <div className="overflow-y-auto scrollbar-none space-y-2 pr-1 min-h-[140px] max-h-[340px] flex-grow">
                {filteredReferrals.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[140px]">
                        <p className="text-xs text-slate-600 font-mono text-center uppercase">
                            NO REFERRALS FOUND MATCHING THIS FILTER.
                        </p>
                    </div>
                ) : (
                    filteredReferrals.map((ref) => (
                        <div key={ref.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono h-[58px] flex justify-between items-center">
                            <div>
                                <p className="text-slate-300 font-bold uppercase">{ref.app_id} APP</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Linked: {new Date(ref.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider block border ${ref.status === 'active' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                                    }`}>
                                    {ref.status}
                                </span>
                                <p className="text-[10px] text-slate-400">Payments: {ref.credits_earned_count}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
