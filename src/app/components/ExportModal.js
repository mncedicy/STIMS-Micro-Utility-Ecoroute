// /src/app/components/ExportModal.jsx
'use client';

import React, { useState } from 'react';
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
    const [statusMsg, setStatusMsg] = useState('');
    const [sending, setSending] = useState(false);

    const initialEmailLookup = user?.email || user?.user?.email || user?.user_metadata?.email || '';
    const [customTargetEmail, setCustomTargetEmail] = useState(initialEmailLookup);

    const getTargetPdfUrl = () => {
        let targetDownloadUrl = `/api/export/pdf?userId=${user?.id}`;
        if (inspectedLogNode?.id?.startsWith('BATCH_INDEX_SET_')) {
            targetDownloadUrl += `&exportType=bulk&startDate=${startDate}&endDate=${endDate}&filterId=${selectedFilterVehicleId}`;
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
        if (!customTargetEmail || !customTargetEmail.includes('@')) {
            setStatusMsg('⚠️ Please enter a valid email address.');
            return;
        }

        setSending(true);
        setStatusMsg('Compiling system compliance report PDF stream...');

        try {
            const response = await fetch(getTargetPdfUrl());
            if (!response.ok) throw new Error(`API stream error: ${response.statusText}`);

            const pdfArrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(pdfArrayBuffer);
            let binaryString = '';
            const len = bytes.byteLength;

            for (let i = 0; i < len; i++) {
                binaryString += String.fromCharCode(bytes[i]);
            }

            const cleanPdfBase64 = btoa(binaryString);
            setStatusMsg('Routing encrypted document payload to email relay...');

            const payloadEnvelope = {
                data: cleanPdfBase64,
                startDate: startDate || "2026-08-01",
                endDate: endDate || "2026-08-31",
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

    return (
        <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono text-xs">
            <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto transition-all duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">EXPORT AUDIT REPORT</h4>
                </div>

                <p className="text-slate-400 leading-relaxed">How would you like to receive your professional carbon audit certificate?</p>

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

                <div className="flex flex-col gap-2 pt-1 text-[10px]">
                    <button
                        type="button"
                        disabled={sending}
                        onClick={handleLocalPdfGeneration}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider text-center cursor-pointer"
                    >
                        📥 Print or Save PDF Locally
                    </button>

                    <button
                        type="button"
                        disabled={sending}
                        onClick={handleEmailOptionClick}
                        className="w-full font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-2.5 rounded-lg transition-all uppercase tracking-wider text-center cursor-pointer"
                    >
                        {sending ? "Processing..." : "📧 Email Clean Report File"}
                    </button>

                    <button type="button" disabled={sending} onClick={onClose} className="w-full text-slate-500 hover:text-slate-400 text-center py-1 mt-1 transition-colors uppercase text-[9px] tracking-widest">Dismiss Options</button>
                </div>
            </div>
        </div>
    );
}
