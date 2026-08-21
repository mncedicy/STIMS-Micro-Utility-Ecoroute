// src\app\components\fleet\CsvUploader.jsx

'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CsvUploader({ onUploadSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [strictModeActive, setStrictModeActive] = useState(true);
    const [message, setMessage] = useState({ success: null, text: "" });
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setMessage({ success: false, text: "Validation Error: Selected attachment must follow a .csv spreadsheet syntax." });
            return;
        }

        setUploading(true);
        setMessage({ success: null, text: "" });

        try {
            const { data: currentSessionData } = await supabase.auth.getSession();
            const accessToken = currentSessionData?.session?.access_token || '';

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/logistics/import-csv', {
                method: 'POST',
                headers: {
                    'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                    'x-strict-validation': strictModeActive ? 'true' : 'false'
                },
                body: formData
            });

            const result = await res.json();
            if (!res.ok || result.error) throw new Error(result.error || 'Server rejected spreadsheet rows processing.');

            setMessage({
                success: true,
                text: `SUCCESS: Processed and saved ${result.imported_records_count} tracking records into your history trail seamlessly! (${result.skipped_failed_rows_count} skipped)`
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
            if (typeof onUploadSuccess === 'function') onUploadSuccess();

        } catch (err) {
            console.error(err);
            setMessage({ success: false, text: err.message || "Ingestion Error: Processing spreadsheet rows failed." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl font-mono text-xs space-y-3 w-full transition-all duration-300 ease-out hover:border-slate-800 stims-hover-glow text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-2">
                <div>
                    <span className="text-blue-500 font-bold uppercase tracking-wider block">BATCH LOGISTICS IMPORTER</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">Upload .csv spreadsheet matrices containing operational travel rows straight from Excel.</span>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-center shrink-0">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-[9px] uppercase tracking-wider text-slate-400 select-none">
                        <input
                            type="checkbox"
                            checked={strictModeActive}
                            onChange={(e) => setStrictModeActive(e.target.checked)}
                            className="bg-slate-950 border-slate-800 rounded text-blue-500 accent-blue-600 cursor-pointer"
                        />
                        <span>Strict Mode (All or Nothing)</span>
                    </label>

                    {/* FIXED: Restored your exact sequential template mapping layout with no department variables */}
                    <a
                        href="data:text/csv;charset=utf-8,Reference_ID,Type,Date,Distance,Unit,Vehicle_Id,Origin,Destination,Passengers,Cargo_Weight,Mass_Unit,Kwh,Country,Quantity,Gas_Type,Gas_Unit%0A1,vehicle,2026-08-11,250,km,df6tw3e9-bbe9-489d-865d-ac2br35t71a2,,,,,,,,,,%0A2,vehicle,2026-08-11,163,km,df4d1ae9-bbe9-489d-865d-ac2b2tu335h8,,,,,,,,,,%0A3,flight,2026-08-11,,,,730,737,2,,,,,,,%0A4,shipping,2026-08-11,234,km,,,,,8500,kg,,,,%0A5,electricity,2026-08-11,,,,,,,,,450,ZA,,,,%0A6,gas,2026-08-11,,,,,,,,,,,75,NATURAL_GAS,m3"
                        download="ecoroute_batch_template.csv"
                        className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors bg-slate-950 px-2 py-1 border border-slate-800 rounded h-fit block select-none whitespace-nowrap cursor-pointer"
                    >
                        📥 Template
                    </a>
                </div>
            </div>

            <div className="relative border border-dashed border-slate-800 bg-slate-950/40 rounded-lg p-6 text-center hover:border-slate-700 transition-colors duration-200">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-1">
                    <div className="text-lg select-none">📊</div>
                    <div className="text-slate-300 font-bold uppercase tracking-wide text-[10px]">
                        {uploading ? "Analyzing Spreadsheet Streams..." : "Click or Drag .csv Spreadsheet Here"}
                    </div>
                    <p className="text-[9px] text-slate-500">Supports sequential reference numbers, vehicle profiles codes, airport IDs, or utility parameters.</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-3 rounded-lg text-[11px] border ${message.success
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                    }`}>
                    <div className="flex items-center space-x-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${message.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="normal-case leading-normal">{message.text}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
