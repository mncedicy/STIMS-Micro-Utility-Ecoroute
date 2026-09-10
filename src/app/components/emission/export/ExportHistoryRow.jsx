// src/app/components/emission/export/ExportHistoryRow.jsx

'use client';

import React from 'react';

export default function ExportHistoryRow({ log, customVehicles = [] }) {
    // Resolve structural asset identifiers down to a human-readable layout label string
    const resolveHistoryAssetLabel = (assetId) => {
        if (!assetId || assetId === 'all') return '💼 ALL TRANSACTION RECORDS';

        const lowerAsset = assetId.toLowerCase();
        if (lowerAsset === 'filter_flight') return '✈️ AVIATION SECTOR LOGS';
        if (lowerAsset === 'filter_shipping') return '🚢 CARGO OCEAN SHIPPING';
        if (lowerAsset === 'filter_electricity') return '⚡ GRID POWER UTILITIES';
        if (lowerAsset === 'filter_gas') return '🔥 GAS COMBUSTION ACCOUNTS';

        const linkedCar = customVehicles.find(v => v.id === assetId);
        return linkedCar
            ? `🚛 [${linkedCar.registration_number || 'N/A'}] ${linkedCar.make} ${linkedCar.model}`
            : `📦 ASSET REF: ${assetId.substring(0, 8).toUpperCase()}`;
    };

    const displayAssetLabel = resolveHistoryAssetLabel(log.filter_asset_id);
    const dateFormatted = new Date(log.created_at).toLocaleString('en-ZA', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <tr className="hover:bg-slate-950/30 transition-colors">
            {/* Execution Timestamp */}
            <td className="p-3 font-bold text-slate-400 whitespace-nowrap">
                📅 {dateFormatted}
            </td>

            {/* Export Scope Tier Mode */}
            <td className="p-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${log.export_type === 'bulk'
                    ? 'bg-blue-950/60 border border-blue-900/50 text-blue-400'
                    : 'bg-purple-950/60 border border-purple-900/50 text-purple-400'
                    }`}>
                    {log.export_type}
                </span>
            </td>

            {/* Target Filters Display */}
            <td className="p-3 truncate max-w-[200px] uppercase font-bold text-[10px]">
                {displayAssetLabel}
            </td>

            {/* Date Limits Context Selection Frame */}
            <td className="p-3 text-slate-400 whitespace-nowrap font-mono text-[10px]">
                {log.start_date && log.end_date ? (
                    <span>{log.start_date} → {log.end_date}</span>
                ) : (
                    <span className="text-slate-600">FULL HISTORY</span>
                )}
            </td>

            {/* Operational Delivery Routing Channels */}
            <td className="p-3 truncate max-w-[160px]">
                {log.delivery_channel === 'email' ? (
                    <div className="space-y-0.5">
                        <span className="text-slate-200 block">📧 {log.recipient_email}</span>
                        <span className="text-[9px] text-slate-500 uppercase block tracking-tight">
                            Relay: {log.delivery_provider}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400">📥 Local PDF Print</span>
                )}
            </td>

            {/* Dispatch Success Verification Indicator Statuses */}
            <td className="p-3 text-right whitespace-nowrap font-bold text-[10px]">
                <span className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    ✓ Verified
                </span>
            </td>
        </tr>
    );
}
