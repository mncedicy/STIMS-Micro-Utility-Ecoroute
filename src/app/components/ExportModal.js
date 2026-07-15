'use client';

import React, { useState } from 'react';
import { emailPdfReport } from '@/app/actions/email';

export default function ExportModal({ user, inspectedLogNode, customVehicles = [], onGeneratePdf, onClose, customBulkTextOverride }) {
    const [statusMsg, setStatusMsg] = useState('');
    const [sending, setSending] = useState(false);

    const initialEmailLookup = user?.email || user?.user?.email || user?.user_metadata?.email || user?.user?.user_metadata?.email || '';
    const [customTargetEmail, setCustomTargetEmail] = useState(initialEmailLookup);

    const matchingCarNode = customVehicles.find(v => v.id === inspectedLogNode?.vehicle_id);
    const activeCarPlateString = matchingCarNode ? `${matchingCarNode.registration_number || matchingCarNode.registration || 'N/A'}` : 'Not Linked to Fleet Asset';

    const getTextPayloadSummary = (log) => {
        const raw = log?.raw_payload || {};
        let text = '';
        if (raw.distance_value) text += `Distance Run Covered:  ${raw.distance_value} ${raw.distance_unit || 'mi'}\n`;
        if (raw.weight_value) text += `Cargo Payload Mass:    ${raw.weight_value} ${raw.weight_unit || 'kg'}\n`;
        if (raw.passengers) text += `Passenger Total Pax:   ${raw.passengers} pax\n`;
        if (raw.legs && raw.legs) text += `Flight Sector Path:    ${raw.legs.departure_airport} -> ${raw.legs.destination_airport}\n`;
        return text || 'Input Parameters:      Manual data lookup parameters\n';
    };

    const handleEmailOptionClick = async (e) => {
        e.preventDefault();
        if (!customTargetEmail || !customTargetEmail.includes('@')) {
            setStatusMsg('⚠️ Please enter a valid email address.');
            return;
        }
        setSending(true);
        setStatusMsg('Compiling report file structure...');

        const rawCertificateContent = customBulkTextOverride || `
========================================================================
                     STIMS ECO-ROUTE CARBON REPORT                      
========================================================================
Log Identifier:      ${inspectedLogNode.id}
Assessment Class:    ${inspectedLogNode.category_display}
Car Registration:    ${activeCarPlateString.toUpperCase()}
${getTextPayloadSummary(inspectedLogNode)}Timestamp Generated: ${new Date(inspectedLogNode.created_at || new Date()).toLocaleString('en-ZA')}
Account Registered:  ${customTargetEmail}

QUANTITATIVE EMISSIONS BREAKDOWN SUMMARY:
------------------------------------------------------------------------
Kilograms (KG CO₂):         ${inspectedLogNode.carbon_kg} kg
Metric Tons (Tons CO₂):      ${inspectedLogNode.carbon_mt} tons
Grams (G CO₂):               ${inspectedLogNode.carbon_g.toLocaleString()} g
Pounds (Lbs CO₂):            ${inspectedLogNode.carbon_lb} lbs

------------------------------------------------------------------------
This document is a certified transaction record from ecoroute.stims.co.za.
========================================================================
    `.trim();

        try {
            const rawTextBytesArray = new TextEncoder().encode(rawCertificateContent);
            let binaryByteString = '';
            for (let i = 0; i < rawTextBytesArray.length; i++) {
                binaryByteString += String.fromCharCode(rawTextBytesArray[i]);
            }
            const uncorruptedDocumentBase64String = btoa(binaryByteString);

            setStatusMsg('Sending report email payload...');
            const result = await emailPdfReport(customTargetEmail, inspectedLogNode.id, inspectedLogNode.category_display, uncorruptedDocumentBase64String);

            if (result.success) {
                setStatusMsg('✅ Report document emailed successfully!');
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
        /* FIXED: Changed to items-center to secure perfect screen vertical centering */
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono text-xs">
            <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto stims-hover-glow transition-all duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">EXPORT AUDIT REPORT</h4>
                </div>

                <p className="text-slate-400 leading-relaxed">How would you like to receive your professional carbon audit certificate?</p>

                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">DESTINATION EMAIL ADDRESS</label>
                    <input type="email" value={customTargetEmail} onChange={(e) => setCustomTargetEmail(e.target.value)} placeholder="Enter your email address" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-800" disabled={sending} />
                </div>

                {statusMsg && (
                    <div className="p-2.5 text-[10px] bg-slate-950/60 border border-slate-800 text-slate-300 rounded font-mono">{statusMsg}</div>
                )}

                <div className="flex flex-col gap-2 pt-1 text-[10px]">
                    <button type="button" disabled={sending} onClick={() => { onGeneratePdf(); onClose(); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider text-center stims-hover-glow cursor-pointer">📥 Print or Save PDF Locally</button>
                    <button type="button" disabled={sending} onClick={handleEmailOptionClick} className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider text-center cursor-pointer stims-hover-glow"> {sending ? "Sending Email..." : "📧 Email Clean Report File"}</button>
                    <button type="button" disabled={sending} onClick={onClose} className="w-full text-slate-500 hover:text-slate-400 text-center py-1 mt-1 transition-colors uppercase text-[9px] tracking-widest">Dismiss Options</button>
                </div>
            </div>
        </div>
    );
}
