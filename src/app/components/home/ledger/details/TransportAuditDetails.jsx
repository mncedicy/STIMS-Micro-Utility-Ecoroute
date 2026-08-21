// src/app/components/home/ledger/details/TransportAuditDetails.jsx

'use client';

import React from 'react';

export default function TransportAuditDetails({ category, log, meta, formatDuration, renderTrips }) {
    if (category === 'vehicle' && (log.input_distance || meta.inputDistance)) {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Vehicle Profile:</span>
                    <span className="text-blue-400 font-bold uppercase truncate max-w-[160px]">
                        {meta.vehicleProfile || 'Fleet Asset'}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Distance Run:</span>
                    <span className="text-white font-bold">
                        {log.input_distance || meta.inputDistance} {log.input_unit || meta.inputUnit || 'km'}
                    </span>
                </div>
                {meta.totalDurationSeconds > 0 && (
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Estimated Duration:</span>
                        <span className="text-blue-400 font-bold">{formatDuration(meta.totalDurationSeconds)}</span>
                    </div>
                )}
                {renderTrips(meta.tripLegsArray, meta.waypointsArray)}
            </div>
        );
    }

    if (category === 'shipping' && (log.cargo_weight || meta.inputWeight)) {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Cargo Freight:</span>
                    <span className="text-white font-bold">
                        {log.cargo_weight || meta.inputWeight} {log.mass_unit || meta.inputMassUnit || 'kg'}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Transit Distance:</span>
                    <span className="text-white font-bold">
                        {log.input_distance || meta.inputDistance} {log.input_unit || meta.inputUnit || 'km'}
                    </span>
                </div>
                {meta.totalDurationSeconds > 0 && (
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Estimated Duration:</span>
                        <span className="text-blue-400 font-bold">{formatDuration(meta.totalDurationSeconds)}</span>
                    </div>
                )}
                {renderTrips(meta.tripLegsArray, meta.waypointsArray)}
            </div>
        );
    }

    if (category === 'flight') {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex flex-col border-b border-slate-900 pb-1 space-y-0.5">
                    <span className="text-slate-500">Flight Sector Route Path:</span>
                    <span className="text-blue-400 font-bold uppercase tracking-wide leading-tight">
                        ✈️ {meta.route_display || `${log.origin_iata} - ${log.dest_iata}`}
                    </span>
                </div>
                {meta.distanceKm && (
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Spherical Distance:</span>
                        <span className="text-slate-300 font-bold">{meta.distanceKm} KM</span>
                    </div>
                )}
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Passengers Pax:</span>
                    <span className="text-white font-bold">{log.passengers_count || 1} pax</span>
                </div>
            </div>
        );
    }

    return null;
}
