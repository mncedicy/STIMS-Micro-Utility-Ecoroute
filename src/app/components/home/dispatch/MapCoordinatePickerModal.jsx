// src/app/components/home/dispatch/MapCoordinatePickerModal.jsx

'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { StaticMapContent } from './MapCoordinatePicker';
import FloatingAddressSearch from './FloatingAddressSearch';
import L from 'leaflet';

// FIXED LEAFLET MARKER RESOLUTION
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapCoordinatePickerModal({ onClose, loadingRoute, markerPositions, roadGeometry, clearPoints, handleMapClick }) {
    const modalMapRef = useRef(null);

    // Forces modal map viewport instance to compute space metrics upon loading
    useEffect(() => {
        setTimeout(() => {
            const mapInstance = modalMapRef.current;
            if (mapInstance) {
                mapInstance.invalidateSize();
                if (markerPositions.length >= 2) {
                    const bounds = L.latLngBounds(markerPositions);
                    mapInstance.fitBounds(bounds, { padding: [40, 40] });
                } else if (markerPositions.length === 1) {
                    mapInstance.setView(markerPositions[0], 13);
                }
            }
        }, 100);
    }, [markerPositions]);

    // COMPUTED MATH LOGIC: Sums up true road geometry leg paths to resolve exact KM metrics
    const getComputedDistanceKm = () => {
        if (markerPositions.length < 2 || roadGeometry.length === 0) return 0;

        let totalMeters = 0;
        for (let i = 0; i < roadGeometry.length - 1; i++) {
            // Leaflet native distance mapping: formats [lat, lng] sets cleanly
            const pointA = L.latLng(roadGeometry[i]);
            const pointB = L.latLng(roadGeometry[i + 1]);
            totalMeters += pointA.distanceTo(pointB);
        }
        return totalMeters / 1000;
    };

    const computedKm = getComputedDistanceKm();

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[99999] select-text font-mono text-xs">
            {/* Backdrop glass overlay */}
            <div className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            {/* Main Maximized Canvas Container Panel */}
            <div className="w-full max-w-6xl h-full max-h-[90vh] bg-[#090d22] border border-blue-900/60 rounded-xl p-5 shadow-2xl relative z-10 animate-fade-in flex flex-col space-y-4 text-left stims-hover-glow">

                {/* Modal Navigation Block */}
                <div className="border-b border-slate-900 pb-0 flex-shrink-0">
                    <span className="text-blue-400 font-black tracking-wider text-[10px] uppercase block mb-1">
                        🗺️ EXPANDED ROUTING GRID CALCULATOR (OSRM)
                    </span>

                    {/* Horizontal 5-column distributed grid matrix */}
                    <div className={`w-full gap-3 min-h-8 flex flex-row items-center justify-between pb-3 ${markerPositions.length >= 2 ? 'md:grid md:grid-cols-5' : ''}`}>

                        {/* Column 1: Shortened, action-oriented status text */}
                        <h4 className={`text-xs text-slate-400 font-sans normal-case leading-relaxed flex items-center pr-2 ${markerPositions.length >= 2 ? 'md:col-span-2' : ''}`}>
                            {loadingRoute ? (
                                <span className="text-blue-400 animate-pulse">⚡ Calculating routes...</span>
                            ) : markerPositions.length >= 2 ? (
                                `🚗 routed: ${markerPositions.length} points (${computedKm.toFixed(0)}km)`
                            ) : (
                                "📍 Drop pins direct"
                            )}
                        </h4>

                        {/* Column 2: The Floating Autocomplete Search Component */}
                        <div className={`relative ${markerPositions.length >= 2 ? 'md:col-span-2' : 'w-72 md:w-80 mx-2'}`}>
                            <FloatingAddressSearch
                                mapInstance={modalMapRef}
                                handleMapClick={handleMapClick}
                            />
                        </div>

                        {/* Column 3: Actions Control Toolbar Panel */}
                        <div className={`flex items-center space-x-2 ml-auto flex-shrink-0 ${markerPositions.length >= 2 ? 'md:col-span-1 md:justify-end' : ''}`}>
                            {markerPositions.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearPoints}
                                    title="Clear Path"
                                    className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950/50 rounded-lg cursor-pointer transition-colors duration-200"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                title="Confirm Framework"
                                className="p-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition-colors duration-200"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Full Scale View Frame Area Panel Workspace */}
                <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0 min-h-[300px]">
                    <StaticMapContent
                        customRef={modalMapRef}
                        markerPositions={markerPositions}
                        roadGeometry={roadGeometry}
                        onMapClick={handleMapClick}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
