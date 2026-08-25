// src/app/components/home/dispatch/DistanceMapModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({ click(e) { onMapClick(e.latlng); } });
    return null;
}

export default function DistanceMapModal({ onClose, onSelectDistance }) {
    const defaultCenter = [-26.02, 28.22];
    const [points, setPoints] = useState([]);
    const [routeGeometry, setRouteGeometry] = useState([]);
    const [drivingDistanceKm, setDrivingDistanceKm] = useState(0);
    const [rawRouteObject, setRawRouteObject] = useState(null);
    const [rawWaypointsObject, setRawWaypointsObject] = useState([]);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (points.length !== 2) {
            setRouteGeometry([]);
            setDrivingDistanceKm(0);
            return;
        }

        const fetchOsrmDrivingRoute = async () => {
            setLoadingRoute(true);
            try {
                const [start, end] = points;
                const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.code === 'Ok' && data.routes?.[0]) {
                    const route = data.routes[0];
                    setDrivingDistanceKm(route.distance / 1000);
                    setRouteGeometry(route.geometry.coordinates.map(coord => [coord[1], coord[0]]));
                    setRawRouteObject(route);
                    setRawWaypointsObject(data.waypoints || []);
                }
            } catch (err) {
                console.error('[OSRM Network Resolution Exception]:', err);
            } finally {
                setLoadingRoute(false);
            }
        };

        fetchOsrmDrivingRoute();
    }, [points]);

    const handleMapClick = (latlng) => {
        if (points.length >= 2) return;
        setPoints([...points, [latlng.lat, latlng.lng]]);
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[99999] select-none font-mono text-xs">
            {/* Backdrop overlay */}
            <div className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

            {/* Main Panel - Now fitting the browser viewport responsively */}
            <div className="w-full max-w-6xl h-full mr-3 max-h-[100vh] bg-[#090d22] border border-blue-900/60 rounded-xl p-5 shadow-2xl relative z-10 animate-fade-in flex flex-col space-y-4 text-left stims-hover-glow">

                {/* Header Block */}
                <div className="border-b border-slate-900 pb-3 flex-shrink-0">
                    <span className="text-blue-400 font-black tracking-wider text-[10px] uppercase block mb-1">
                        🗺️ REAL DRIVING DISTANCE ROUTING CALCULATOR (OSRM)
                    </span>

                    {/* Clean horizontal structure with full width support */}
                    <div className="flex flex-row items-center justify-between gap-3 min-h-8 w-full">
                        <h4 className="text-xs text-slate-400 font-sans normal-case leading-relaxed flex items-center pr-2">
                            {loadingRoute ? (
                                <span className="text-blue-400 animate-pulse">⚡ Calculating OSRM route...</span>
                            ) : points.length === 2 ? (
                                `🚗 True road routing solved: ${drivingDistanceKm.toFixed(1)} KM.`
                            ) : (
                                "📍 Drop start and destination pins on the map."
                            )}
                        </h4>

                        {/* Actions Panel - Safely locked to the far right on all screens */}
                        <div className="flex items-center space-x-2 ml-auto flex-shrink-0">
                            {/* Reset Button */}
                            <button
                                type="button"
                                onClick={() => setPoints([])}
                                title="Reset"
                                className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950/50 rounded-lg cursor-pointer transition-colors duration-200"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Cancel Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                title="Cancel"
                                className="p-1.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 rounded-lg cursor-pointer transition-colors duration-200"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Populate Field Button */}
                            <button
                                type="button"
                                disabled={points.length !== 2 || loadingRoute}
                                onClick={() => onSelectDistance(drivingDistanceKm, rawRouteObject?.duration, rawRouteObject?.legs, rawWaypointsObject)}
                                title="Populate Field"
                                className="p-1.5 bg-blue-600 disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-lg cursor-pointer disabled:cursor-not-allowed hover:bg-blue-500 transition-colors duration-200"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map Frame - Fills the rest of the available modal workspace */}
                <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0 min-h-[300px]">
                    <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {points.map((pos, idx) => <Marker key={idx} position={pos} />)}
                        {routeGeometry.length > 0 && <Polyline positions={routeGeometry} color="#0160f9" weight={4} opacity={0.85} />}
                    </MapContainer>
                </div>

            </div>
        </div>,
        document.body
    );

}
