// src/app/components/home/ledger/LedgerParametersSummary.jsx

'use client';

import React from 'react';
import TransportAuditDetails from './details/TransportAuditDetails';
import UtilityAuditDetails from './details/UtilityAuditDetails';
import SpecialAuditDetails from './details/SpecialAuditDetails';

export default function LedgerParametersSummary({ log }) {
    if (!log) return null;

    const category = log.category_display?.toLowerCase();
    const payloadObject = typeof log.raw_payload === 'string' ? JSON.parse(log.raw_payload) : (log.raw_payload || {});
    const meta = payloadObject?.metadata || {};

    const formatDurationDisplayString = (secondsCount) => {
        if (!secondsCount || isNaN(secondsCount)) return '0s';
        const mins = Math.floor(secondsCount / 60);
        const secs = Math.floor(secondsCount % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const renderSequentialTripLegsMatrix = (legsArray, waypointsArray) => {
        if (!Array.isArray(legsArray) || legsArray.length === 0) return null;
        return (
            <div className="pt-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                    Sequential Trace Matrix Logs:
                </span>
                <div className="max-h-40 overflow-y-auto border border-slate-900 bg-slate-950/60 rounded p-1.5 space-y-2 custom-scrollbar text-[10px]">
                    {legsArray.map((leg, idx) => {
                        const wpStart = waypointsArray?.[idx];
                        const wpEnd = waypointsArray?.[idx + 1];

                        const startLabel = wpStart?.name?.trim() !== '' ? wpStart.name : (wpStart?.location ? `${wpStart.location[1].toFixed(4)}, ${wpStart.location[0].toFixed(4)}` : `WP-${idx + 1}`);
                        const endLabel = wpEnd?.name?.trim() !== '' ? wpEnd.name : (wpEnd?.location ? `${wpEnd.location[1].toFixed(4)}, ${wpEnd.location[0].toFixed(4)}` : `WP-${idx + 2}`);

                        return (
                            <div key={idx} className="border-b border-slate-900/60 pb-1.5 last:border-none last:pb-0 space-y-0.5 text-left text-slate-300">
                                <span className="text-blue-500 font-bold text-[9px] block">TRIP {idx + 1}:</span>
                                <div className="flex items-center justify-between gap-1 leading-tight text-slate-200 text-[10px] w-full">
                                    <div className="truncate max-w-[45%]">
                                        <span className="text-slate-500 font-bold text-[9px] mr-1 uppercase">From:</span>
                                        <span title={startLabel}>{startLabel}</span>
                                    </div>
                                    <span className="text-slate-600 font-black px-1 text-[10px] shrink-0">→</span>
                                    <div className="truncate max-w-[45%] text-right">
                                        <span className="text-slate-500 font-bold text-[9px] mr-1 uppercase">To:</span>
                                        <span title={endLabel}>{endLabel}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                                    <span>Dist: <strong className="text-slate-400">{(leg.distance / 1000).toFixed(2)} km</strong></span>
                                    <span>Time: <strong className="text-slate-400">{formatDurationDisplayString(leg.duration)}</strong></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg text-[11px] text-slate-400 space-y-1.5 font-mono max-w-full">
            <span className="text-[9px] text-blue-500 font-bold block uppercase tracking-wider mb-1">
                Verified Audit Input Bounds
            </span>

            {/* 1. Vehicle, Shipping, and Flight Tabs Detail Mappings */}
            <TransportAuditDetails
                category={category} log={log} meta={meta}
                formatDuration={formatDurationDisplayString} renderTrips={renderSequentialTripLegsMatrix}
            />

            {/* 2. Electricity and Gas Utility Mappings */}
            <UtilityAuditDetails category={category} log={log} meta={meta} />

            {/* 3. Dedicated Route Checker and Carbon Tax Special Mappings */}
            <SpecialAuditDetails
                log={log} meta={meta}
                formatDuration={formatDurationDisplayString} renderTrips={renderSequentialTripLegsMatrix}
            />
        </div>
    );
}
