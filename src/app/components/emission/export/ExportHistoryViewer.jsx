// src/app/components/emission/export/ExportHistoryViewer.jsx

'use client';

import React, { useState, useEffect } from 'react';
import ExportHistoryRow from './ExportHistoryRow';
import { getExportHistoryLedger } from '../../../actions/exportHistory';

export default function ExportHistoryViewer({ user, customVehicles = [] }) {
    const [historyLogs, setHistoryLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const targetUserId = user?.id || user?.user?.id || user?.user_metadata?.sub;

    const fetchHistoryLedger = async () => {
        if (!targetUserId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await getExportHistoryLedger(targetUserId);
            if (response.success) {
                setHistoryLogs(response.data || []);
            } else {
                console.warn('⚠️ [ExportHistoryViewer] Server reported validation exception:', response.error);
            }
        } catch (err) {
            console.error('🚨 [ExportHistoryViewer] Unexpected code execution crash:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryLedger();
    }, [targetUserId]);

    // Reset pagination window position if a user inputs filter variables
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredHistory = historyLogs.filter(log => {
        const matchesSearch = (log.recipient_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.delivery_channel || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Calculate structural array partitioning slices
    const totalPages = Math.ceil(filteredHistory.length / recordsPerPage) || 1;
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedRecords = filteredHistory.slice(startIndex, startIndex + recordsPerPage);

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 w-full font-mono relative mt-6  stims-hover-glow transition-all duration-300">
            <div className="border-b border-slate-800 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-0.5">
                    <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Compliance Export Audit Trail
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-tight">
                        Review past carbon audit certificates generated locally or routed through secure email relays.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 font-mono text-[11px] min-h-[28px] max-w-[140px]"
                    />
                    <button
                        type="button"
                        onClick={fetchHistoryLedger}
                        className="border border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-slate-950 hover:border-slate-600/50 hover:text-white transition-all text-center inline-block cursor-pointer stims-hover-glow:hover"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {!targetUserId ? (
                <div className="text-center py-8 text-amber-500/70 text-xs border border-dashed border-amber-900/40 rounded-md bg-amber-950/5">
                    ⚠️ Authenticated identity parsing delayed. Verifying operator run tokens...
                </div>
            ) : loading ? (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">
                    Compiling secure extraction logs array metrics...
                </div>
            ) : filteredHistory.length > 0 ? (
                <div className="space-y-4">
                    <div className="overflow-x-auto border border-slate-950 rounded bg-slate-950/20 divide-y divide-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-900 font-bold">
                                    <th className="p-3">TIMESTAMP</th>
                                    <th className="p-3">EXPORT TIER</th>
                                    <th className="p-3">TARGET ASSIGNED PARAMETERS</th>
                                    <th className="p-3">DATE RANGE BOUNDS</th>
                                    <th className="p-3">DELIVERY CHANNEL</th>
                                    <th className="p-3 text-right">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/40 text-slate-300">
                                {paginatedRecords.map((log) => (
                                    <ExportHistoryRow
                                        key={log.id}
                                        log={log}
                                        customVehicles={customVehicles}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Context Navigation Controls Panel */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <div>
                            Showing <span className="text-slate-300 font-bold">{startIndex + 1}</span> to{' '}
                            <span className="text-slate-300 font-bold">
                                {Math.min(startIndex + recordsPerPage, filteredHistory.length)}
                            </span>{' '}
                            of <span className="text-slate-300 font-bold">{filteredHistory.length}</span> Records
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className={`border border-slate-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-md bg-slate-950 transition-all ${currentPage === 1
                                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                                    : 'text-slate-400 hover:border-slate-600/50 hover:text-white stims-hover-glow:hover cursor-pointer'
                                    }`}
                            >
                                ◀ Previous
                            </button>
                            <div className="text-slate-400 font-bold px-1 whitespace-nowrap">
                                Page {currentPage} / {totalPages}
                            </div>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className={`border border-slate-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-md bg-slate-950 transition-all ${currentPage === totalPages
                                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                                    : 'text-slate-400 hover:border-slate-600/50 hover:text-white stims-hover-glow:hover cursor-pointer'
                                    }`}
                            >
                                Next ▶
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-md bg-slate-950/10">
                    No historical document generation trail logs captured inside this environment ledger context.
                </div>
            )}
        </div>
    );
}
