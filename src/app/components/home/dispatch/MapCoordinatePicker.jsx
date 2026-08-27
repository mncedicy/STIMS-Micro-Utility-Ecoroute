// src/app/components/home/dispatch/MapCoordinatePicker.jsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RotateCcw, Maximize2 } from 'lucide-react';
import MapCoordinatePickerModal from './MapCoordinatePickerModal';

// FIXED LEAFLET MARKER RESOLUTION
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Steady South Africa regional workspace coordinate anchor
const DEFAULT_CENTER = [-26.02, 28.22];

function MapEventsHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// IMMUTABLE MAP INTERNALS RUNNER (Shared across components to stop rendering loops)
export function StaticMapContent({ customRef, markerPositions, roadGeometry, onMapClick }) {
    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={11}
            ref={customRef}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEventsHandler onMapClick={onMapClick} />

            {markerPositions.map((pos, idx) => (
                <Marker key={idx} position={pos} />
            ))}

            {roadGeometry.length > 0 && (
                <Polyline positions={roadGeometry} color="#2563eb" weight={3} opacity={0.85} />
            )}
        </MapContainer>
    );
}

export default function MapCoordinatePicker({ coordinates, onCoordinatesChange, setOsrmTotalDuration, setOsrmLegsData, setOsrmWaypointsData }) {
    const [roadGeometry, setRoadGeometry] = useState([]);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const inlineMapRef = useRef(null);

    // Parse coordinate strings safely
    const markerPositions = (Array.isArray(coordinates) ? coordinates : [])
        .map(coord => {
            if (!coord || typeof coord !== 'string' || !coord.includes(',')) return null;
            const parts = coord.split(',');
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            return (!isNaN(lat) && !isNaN(lon)) ? [lat, lon] : null;
        })
        .filter(pos => pos !== null);

    // OSRM Data Fetch Pipe Engine
    useEffect(() => {
        if (markerPositions.length < 2) {
            setRoadGeometry([]);
            if (setOsrmTotalDuration) setOsrmTotalDuration(0);
            if (setOsrmLegsData) setOsrmLegsData([]);
            if (setOsrmWaypointsData) setOsrmWaypointsData([]);
            return;
        }

        const fetchSequentialOsrmRoute = async () => {
            setLoadingRoute(true);
            try {
                const coordinateStringParam = markerPositions
                    .map(pos => `${pos[1]},${pos[0]}`)
                    .join(';');

                const url = `https://router.project-osrm.org/route/v1/driving/${coordinateStringParam}?overview=full&geometries=geojson`; const res = await fetch(url);
                const data = await res.json();

                if (data.code === 'Ok' && data.routes?.[0]) {
                    const route = data.routes[0];
                    const pathCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setRoadGeometry(pathCoordinates);

                    if (setOsrmTotalDuration) setOsrmTotalDuration(route.duration);
                    if (setOsrmLegsData) setOsrmLegsData(route.legs || []);
                    if (setOsrmWaypointsData) setOsrmWaypointsData(data.waypoints || []);
                }
            } catch (err) {
                console.error('[Map Tracker OSRM Matrix Exception]:', err);
            } finally {
                setLoadingRoute(false);
            }
        };

        fetchSequentialOsrmRoute();
    }, [coordinates]);

    // AUTO-FIT BOUNDS ON MODAL CLOSE
    const handleCloseModal = () => {
        setIsMaximized(false);

        setTimeout(() => {
            const mapInstance = inlineMapRef.current;
            if (mapInstance && markerPositions.length > 0) {
                mapInstance.invalidateSize();
                if (markerPositions.length === 1) {
                    mapInstance.setView(markerPositions[0], 13);
                } else {
                    const bounds = L.latLngBounds(markerPositions);
                    mapInstance.fitBounds(bounds, { padding: [30, 30] });
                }
            }
        }, 50);
    };

    const handleMapClick = (latlng) => {
        if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') return;
        const coordinateString = `${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`;
        onCoordinatesChange([...coordinates, coordinateString]);
    };

    const clearPoints = () => {
        onCoordinatesChange([]);
        setRoadGeometry([]);
        if (setOsrmTotalDuration) setOsrmTotalDuration(0);
        if (setOsrmLegsData) setOsrmLegsData([]);
        if (setOsrmWaypointsData) setOsrmWaypointsData([]);
    };

    return (
        <div className="space-y-2 mt-2 font-mono text-xs">
            <div className="flex justify-between items-center w-full min-h-8">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold h-5 flex items-center pr-2">
                    {loadingRoute ? (
                        <span className="text-blue-400 animate-pulse">⚡ SNAP-ROUTING SYSTEM TO ROAD NETWORKS...</span>
                    ) : (
                        `Interactive Sequence Route Builder (${markerPositions.length} Points Mapped)`
                    )}
                </span>

                <div className="flex items-center space-x-2 ml-auto flex-shrink-0">
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
                        onClick={() => setIsMaximized(true)}
                        title="Maximize Workspace"
                        className="hidden md:flex p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-950/50 rounded-lg cursor-pointer transition-colors duration-200"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Embedded Baseline Screen Panel */}
            <div className="h-64 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0">
                <StaticMapContent
                    customRef={inlineMapRef}
                    markerPositions={markerPositions}
                    roadGeometry={roadGeometry}
                    onMapClick={handleMapClick}
                />
            </div>

            <p className="text-[10px] text-slate-500 italic">
                💡 Click directly on the map surface panel above sequentially to plot logistics waypoint paths.
            </p>

            {/* Decoupled Portaled Modal Layer */}
            {isMaximized && (
                <MapCoordinatePickerModal
                    onClose={handleCloseModal}
                    loadingRoute={loadingRoute}
                    markerPositions={markerPositions}
                    roadGeometry={roadGeometry}
                    clearPoints={clearPoints}
                    handleMapClick={handleMapClick}
                />
            )}
        </div>
    );
}
