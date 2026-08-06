'use client';

import React, { useState } from 'react';
import { emailPdfReport } from '@/app/actions/email';

export default function ExportModal({ user, inspectedLogNode, customVehicles = [], onGeneratePdf, onClose, customBulkTextOverride }) {
    const [statusMsg, setStatusMsg] = useState('');
    const [sending, setSending] = useState(false);

    const initialEmailLookup = user?.email || user?.user?.email || user?.user_metadata?.email || '';
    const [customTargetEmail, setCustomTargetEmail] = useState(initialEmailLookup);

    const matchingCarNode = customVehicles.find(v => v.id === inspectedLogNode?.vehicle_id);
    const activeCarPlateString = matchingCarNode ? `${matchingCarNode.registration_number || 'N/A'}` : 'Not Linked to Fleet Asset';

    const getTextPayloadSummary = (log) => {
        if (!log) return '';
        let text = '';
        if (log.input_distance) text += `Distance Run Covered:  ${log.input_distance} ${log.input_unit || 'km'}\n`;
        if (log.cargo_weight) text += `Cargo Payload Mass:    ${log.cargo_weight} ${log.mass_unit || 'kg'}\n`;
        if (log.passengers_count) text += `Passenger Total Pax:   ${log.passengers_count} pax\n`;
        if (log.origin_iata && log.dest_iata) text += `Flight Sector Path:    ${log.origin_iata} -> ${log.dest_iata}\n`;
        if (log.energy_kwh) text += `Electric Power Load:   ${log.energy_kwh} kWh\n`;
        if (log.gas_quantity) text += `Gas Combustion Volume: ${log.gas_quantity} ${log.gas_unit}\n`;
        return text || 'Input Parameters:      Offline system calculation metrics\n';
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
Grams (G CO₂):               ${inspectedLogNode.carbon_g ? inspectedLogNode.carbon_g.toLocaleString() : 0} g
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
                    <button type="button" disabled onClick={handleEmailOptionClick} className="w-full font-medium bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold py-2.5 rounded-lg transition-all uppercase tracking-wider text-center cursor-not-allowed select-none">{sending ? "Sending Email..." : "📧 Email Clean Report File"}</button>
                    <button type="button" disabled={sending} onClick={onClose} className="w-full text-slate-500 hover:text-slate-400 text-center py-1 mt-1 transition-colors uppercase text-[9px] tracking-widest">Dismiss Options</button>
                </div>
            </div>
        </div>
    );
}