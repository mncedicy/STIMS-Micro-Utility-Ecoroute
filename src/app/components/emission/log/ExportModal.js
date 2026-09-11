// src/app/components/emission/log/ExportModal.js

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { emailPdfReport } from '@/app/actions/email';

export default function ExportModal({
    user,
    inspectedLogNode,
    customVehicles = [],
    onClose,
    startDate,
    endDate,
    selectedFilterVehicleId
}) {
    const [mounted, setMounted] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [sending, setSending] = useState(false);

    const initialEmailLookup = user?.email || user?.user?.email || user?.user_metadata?.email || '';
    const [customTargetEmail, setCustomTargetEmail] = useState(initialEmailLookup);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const getTargetPdfUrl = () => {
        let targetDownloadUrl = `/api/export/pdf?userId=${user?.id}`;
        if (inspectedLogNode?.id?.startsWith('BATCH_INDEX_SET_')) {
            targetDownloadUrl += `&exportType=bulk&startDate=${startDate}&endDate=${endDate}&filterId=${selectedFilterVehicleId || 'all'}`;
        } else {
            targetDownloadUrl += `&exportType=single&logId=${inspectedLogNode?.id}`;
        }
        return targetDownloadUrl;
    };

    const handleLocalPdfGeneration = () => {
        if (!user?.id) return setStatusMsg('⚠️ Active user session parameters dropped.');
        window.open(getTargetPdfUrl(), '_blank');
        onClose();
    };

    const handleEmailOptionClick = async (e) => {
        e.preventDefault();

        if (!user?.id) return setStatusMsg('⚠️ Active user session parameters dropped.');

        if (!customTargetEmail || !customTargetEmail.includes('@')) {
            setStatusMsg('⚠️ Please enter a valid email address.');
            return;
        }

        setSending(true);
        setStatusMsg('Routing secure document payload request to email relay...');

        try {
            // Forward filter tracking variables directly into structural metadata envelope
            const payloadEnvelope = {
                startDate: startDate,
                endDate: endDate,
                filterId: selectedFilterVehicleId || "all",
                userId: user?.id || user?.user?.id
            };

            const result = await emailPdfReport(
                customTargetEmail,
                inspectedLogNode.id,
                inspectedLogNode.category_display,
                payloadEnvelope
            );

            if (result.success) {
                setStatusMsg('✅ Professional compliance PDF report emailed successfully!');
                setTimeout(onClose, 2000);
            } else {
                throw new Error(result.error || 'Email distribution rejected.');
            }
        } catch (err) {
            setStatusMsg(`⚠️ Error: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono text-xs">
            <div className="w-full max-w-md p-6 bg-slate-900 border stims-hover-glow transition-all duration-300 border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">EXPORT AUDIT REPORT</h4>
                    </div>
                    {/* Dismiss Icon Button */}
                    <button
                        type="button"
                        disabled={sending}
                        onClick={onClose}
                        className="text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest cursor-pointer"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>

                {/* Corporate Account Token Usage Advisory Banner */}
                <div className="p-2.5 bg-blue-950/30 border border-blue-900/40 text-blue-400 rounded-lg text-[10px] leading-normal flex items-start space-x-2">
                    <span className="shrink-0 mt-0.5">ℹ️</span>
                    <span>
                        <strong>QUOTA NOTICE:</strong> Generating or emailing this document will deduct <strong>1 request token</strong> from your corporate monthly limit.
                    </span>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">DESTINATION EMAIL ADDRESS</label>
                    <input
                        type="email"
                        value={customTargetEmail}
                        onChange={(e) => setCustomTargetEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-800"
                        disabled={sending}
                    />
                </div>

                {statusMsg && (
                    <div className="p-2.5 text-[10px] bg-slate-950/60 border border-slate-800 text-slate-300 rounded font-mono">{statusMsg}</div>
                )}

                {/* Print and Email buttons in 1 row */}
                <div className="flex gap-2 pt-1 text-[10px]">
                    <button
                        type="button"
                        disabled={sending}
                        onClick={handleLocalPdfGeneration}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider text-center stims-hover-glow cursor-pointer"
                    >
                        📥 Print
                    </button>

                    <button
                        type="button"
                        disabled={sending}
                        onClick={handleEmailOptionClick}
                        className="w-full font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-2.5 rounded-lg transition-all uppercase tracking-wider text-center stims-hover-glow cursor-pointer"
                    >
                        {sending ? "Processing..." : "📧 Email"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );



}
