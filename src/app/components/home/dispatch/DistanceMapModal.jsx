// src/app/components/home/dispatch/DistanceMapModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// FIXED LEAFLET MARKER RESOLUTION: Matches exact 1.9.4 footprint to bypass Next.js image loading faults
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

export default function DistanceMapModal({ onClose, onSelectDistance }) {
    const defaultCenter = [-26.02, 28.22]; // Default South Africa regional workspace coordinates
    const [points, setPoints] = useState([]);
    const [mounted, setMounted] = useState(false);

    // Track hydration so portal executing rules don't mismatch during Next SSR handshakes
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleMapClick = (latlng) => {
        if (points.length >= 2) return;
        setPoints([...points, [latlng.lat, latlng.lng]]);
    };

    const evaluateHaversineDistanceKm = (p1, p2) => {
        const R = 6371;
        const dLat = (p2[0] - p1[0]) * (Math.PI / 180);
        const dLon = (p2[1] - p1[1]) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[0] * (Math.PI / 180)) * Math.cos(p2[0] * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1.25;
    };

    const calculatedDistanceKm = points.length === 2 ? evaluateHaversineDistanceKm(points[0], points[1]) : 0;

    if (!mounted) return null;

    // Renders using direct global document portal mapping injection safely
    return createPortal(
        /* FIXED PORTAL OVERLAY BOUNDS: Enforces explicit top window screen alignment via global viewport rules */
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-start pt-10 px-4 z-[99999] select-none font-mono text-xs">
            {/* Dark glass backdrop mask layer */}
            <div className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            {/* Modal Dialog Box content frame */}
            <div className="w-full max-w-lg bg-[#090d22] border border-blue-900 rounded-xl p-5 shadow-2xl relative z-[100000] animate-fade-in space-y-4 text-left stims-hover-glow">

                <div className="border-b border-slate-900 pb-2">
                    <span className="text-blue-400 font-black tracking-wider text-[10px] uppercase block mb-0.5">
                        🗺️ INTERACTIVE FREIGHT DISTANCE MATRIX CALCULATOR
                    </span>
                    <h4 className="text-xs text-slate-400 font-sans normal-case leading-relaxed">
                        {points.length === 0 && "📍 Click on the map to set your freight's starting waypoint point."}
                        {points.length === 1 && "📍 Click again to drop your cargo's destination waypoint point."}
                        {points.length === 2 && `⚡ Waypoints mapped successfully. Haversine distance evaluated at ${calculatedDistanceKm.toFixed(1)} KM.`}
                    </h4>
                </div>

                {/* Interactive Map Box Canvas Frame */}
                <div className="h-72 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0">
                    <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />

                        {points.map((pos, idx) => (
                            <Marker key={idx} position={pos} />
                        ))}

                        {points.length === 2 && (
                            <Polyline positions={points} color="#2563eb" weight={3} dashArray="5, 10" />
                        )}
                    </MapContainer>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-900/60">
                    <button
                        type="button"
                        onClick={() => setPoints([])}
                        disabled={points.length === 0}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 text-slate-400 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                        Reset Pins
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={points.length !== 2}
                        onClick={() => onSelectDistance(calculatedDistanceKm)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                        Populate Field
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
