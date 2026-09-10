// src/app/components/referrals/modules/ReferralHistoryLedger.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function ReferralHistoryLedger({ referrals = [], ledger = [] }) {
    const [activeTab, setActiveTab] = useState('conversions'); // 'conversions' or 'payouts'
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;

    // Reset pagination to page 1 whenever switching tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Determine target list based on current active tab selection parameters
    const targetDataset = activeTab === 'conversions' ? referrals : ledger;

    // Calculate structural array partitioning slices
    const totalPages = Math.ceil(targetDataset.length / recordsPerPage) || 1;
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedRecords = targetDataset.slice(startIndex, startIndex + recordsPerPage);

    return (
        <div className="stims-panel-card space-y-4 flex flex-col h-full">
            {/* Tab Controller Strip Switcher */}
            <div className="flex border-b border-slate-900 pb-2 gap-4 shrink-0">
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

            {/* Content Windows Wrapper: Fixed height constraints handling partitioned view bounds */}
            <div className="overflow-y-auto scrollbar-none space-y-2 pr-1 min-h-[140px] max-h-[340px] flex-grow">

                {/* 1. Tracked Conversions Node Grid */}
                {activeTab === 'conversions' && (
                    paginatedRecords.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[140px]">
                            <p className="text-xs text-slate-600 font-mono py-4 text-center uppercase">
                                NO SIGNUPS LINKED TO YOUR TRACKING URL YET.
                            </p>
                        </div>
                    ) : (
                        paginatedRecords.map((ref) => (
                            <div key={ref.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex flex-col space-y-2 min-h-[58px]">
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
                                    <span>Linked: {new Date(ref.created_at).toLocaleDateString('en-ZA')}</span>
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* 2. Historical Ledger Payout Lines Grid */}
                {activeTab === 'payouts' && (
                    paginatedRecords.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[140px]">
                            <p className="text-xs text-slate-600 font-mono py-4 text-center uppercase">
                                NO PAYOUT TRANSACTIONS FOUND IN THIS SPECIFIED NODE.
                            </p>
                        </div>
                    ) : (
                        paginatedRecords.map((row) => (
                            <div key={row.id} className="p-3 bg-[#020617] border border-slate-900 rounded-lg text-xs font-mono flex justify-between items-center min-h-[58px]">
                                <div className="space-y-0.5">
                                    <p className="text-slate-300 font-medium">Commission Distribution</p>
                                    <p className="text-[9px] text-slate-600">
                                        Ref: #{row.id?.substring(0, 8).toUpperCase() || 'N/A'} • {new Date(row.created_at).toLocaleDateString('en-ZA')}
                                    </p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-white font-bold tracking-wide">
                                        R{(row.amount_cents / 100).toFixed(2)}
                                    </p>
                                    <span className={`text-[8px] uppercase tracking-tighter px-1.5 py-0.5 rounded font-bold border text-center block ${row.payout_status === 'paid'
                                        ? 'bg-emerald-950/60 border-emerald-900/40 text-emerald-400'
                                        : 'bg-amber-950/60 border-amber-900/40 text-amber-400'
                                        }`}>
                                        {row.payout_status === 'paid' ? 'PAID' : row.payout_status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )
                )}

            </div>

            {/* Pagination Controls Footer Container */}
            {targetDataset.length > recordsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono shrink-0">
                    <div>
                        Showing <span className="text-slate-300 font-bold">{startIndex + 1}</span> to{' '}
                        <span className="text-slate-300 font-bold">
                            {Math.min(startIndex + recordsPerPage, targetDataset.length)}
                        </span>_
                        of <span className="text-slate-300 font-bold">{targetDataset.length}</span> Logs
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={`border border-slate-900 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-950 transition-all ${currentPage === 1
                                ? 'opacity-40 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:border-slate-700 hover:text-white stims-hover-glow cursor-pointer'
                                }`}
                        >
                            ◀ Prev
                        </button>
                        <div className="text-slate-400 font-bold px-1 whitespace-nowrap">
                            {currentPage} / {totalPages}
                        </div>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={`border border-slate-900 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-950 transition-all ${currentPage === totalPages
                                ? 'opacity-40 cursor-not-allowed text-slate-600'
                                : 'text-slate-400 hover:border-slate-700 hover:text-white stims-hover-glow cursor-pointer'
                                }`}
                        >
                            Next ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
