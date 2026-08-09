// /src/app/components/ApiFields.jsx
'use client';

import React from 'react';

export default function ApiFields({ userId }) {
    return (
        <div className="space-y-1 leading-relaxed font-mono text-[10px]">
            <span className="text-slate-300 font-bold uppercase block tracking-wider text-[11px] border-b border-slate-900 pb-1">FIELD DESCRIPTIONS</span>
            <div className="divide-y divide-slate-900/40 space-y-1">
                <div className="py-1"><strong className="text-slate-200">type:</strong> Required string. Must evaluate strictly to <code className="text-emerald-400">"vehicle"</code>, <code className="text-emerald-400">"flight"</code>, <code className="text-emerald-400">"shipping"</code>, <code className="text-emerald-400">"electricity"</code>, or <code className="text-emerald-400">"gas"</code>.</div>
                <div className="py-1"><strong className="text-slate-200">vehicle_id:</strong> Required for vehicles. String UUID matching an asset key from your fleet registry.</div>
                <div className="py-1"><strong className="text-slate-200">distance:</strong> Required for vehicle/shipping. Positive decimal number tracker parameter.</div>
                <div className="py-1"><strong className="text-slate-200">unit:</strong> String code tracking measurement distance. Accepts <code className="text-emerald-400">"km"</code> or <code className="text-emerald-400">"miles"</code>.</div>
                <div className="py-1"><strong className="text-slate-200">origin_identifier / dest_identifier:</strong> Required for flights. Numeric airport lookup keys.</div>
                <div className="py-1"><strong className="text-slate-200">passengers:</strong> Integer value tracking flight occupants count boundaries. Defaults to <code className="text-emerald-400">1</code>.</div>
                <div className="py-1"><strong className="text-slate-200">cargo_weight / mass_unit:</strong> Required for shipping. Mass values paired with options: <code className="text-emerald-400">"kg"</code>, <code className="text-emerald-400">"lbs"</code>, or <code className="text-emerald-400">"tonnes"</code>.</div>
                <div className="py-1"><strong className="text-slate-200">energy_kwh / country_code:</strong> Required for electricity. Power units with a 2-char country ISO code (e.g. <code className="text-emerald-400">"ZA"</code>).</div>
                <div className="py-1"><strong className="text-slate-200">gas_quantity / gas_type / gas_unit:</strong> Required for gas. <code className="text-emerald-400">"gas_type"</code> accepts <code className="text-emerald-400">"NATURAL_GAS"</code> or <code className="text-emerald-400">"LPG"</code>.</div>
                <div className="py-1"><strong className="text-slate-200">emission_date:</strong> Optional custom string (YYYY-MM-DD). Future dates are blocked. Defaults to today.</div>

                {/* FIXED: Adjusted description matching the updated quota count rule */}
                <div className="py-1"><strong className="text-slate-200">save_log:</strong> Optional boolean. Defaults to <code className="text-emerald-400">true</code>. If set to <code className="text-rose-400">false</code>, the engine performs the full footprint calculation but skips saving to the database ledger entirely. Note: Dry-run API checks continue to draw down from your monthly active request tier token allocation quota limits.</div>

                <div className="py-2 bg-slate-950/20 px-2 rounded space-y-2">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                        <a href="/api/export/airports" download className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-400 hover:text-white px-2.5 py-1.5 rounded [9px] font-bold uppercase tracking-wider transition-all inline-block shadow-sm text-center">📥 Download Airport List CSV</a>
                        <a href={`/api/export/vehicles?userId=${userId || ''}`} download className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded [9px] font-bold uppercase tracking-wider transition-all inline-block shadow-sm text-center">📥 Download Vehicle List CSV</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
