// src/app/components/home/dispatch/DistanceMapModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-start pt-10 px-4 z-[99999] select-none font-mono text-xs">
            <div className="absolute inset-0 w-full h-full bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
            <div className="w-full max-w-lg bg-[#090d22] border border-blue-900 rounded-xl p-5 shadow-2xl relative z-10 animate-fade-in space-y-4 text-left stims-hover-glow">
                <div className="border-b border-slate-900 pb-2">
                    <span className="text-blue-400 font-black tracking-wider text-[10px] uppercase block mb-0.5">🗺️ REAL DRIVING DISTANCE ROUTING CALCULATOR (OSRM)</span>
                    <h4 className="text-xs text-slate-400 font-sans normal-case leading-relaxed h-5 flex items-center">
                        {loadingRoute ? <span className="text-blue-400 animate-pulse">⚡ SOLVING REAL ROAD NETWORK ROUTE VIA OSRM...</span> : (points.length === 2 ? `🚗 True road routing solved: ${drivingDistanceKm.toFixed(1)} KM.` : "📍 Drop start and destination target pins onto the map panel.")}
                    </h4>
                </div>
                <div className="h-72 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0">
                    <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {points.map((pos, idx) => <Marker key={idx} position={pos} />)}
                        {routeGeometry.length > 0 && <Polyline positions={routeGeometry} color="#3b82f6" weight={4} opacity={0.85} />}
                    </MapContainer>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-900/60">
                    <button type="button" onClick={() => setPoints([])} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] rounded-lg cursor-pointer">Reset</button>
                    <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] rounded-lg cursor-pointer">Cancel</button>
                    <button type="button" disabled={points.length !== 2 || loadingRoute} onClick={() => onSelectDistance(drivingDistanceKm, rawRouteObject?.duration, rawRouteObject?.legs, rawWaypointsObject)} className="px-4 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg cursor-pointer">Populate Field</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
