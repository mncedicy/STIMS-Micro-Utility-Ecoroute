// src/app/components/home/dispatch/MapCoordinatePicker.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapEventsHandler({ onMapClick }) {
    useMapEvents({ click(e) { onMapClick(e.latlng); } });
    return null;
}

export default function MapCoordinatePicker({ coordinates, onCoordinatesChange, setOsrmTotalDuration, setOsrmLegsData, setOsrmWaypointsData }) {
    const defaultCenter = [-26.02, 28.22];
    const [roadGeometry, setRoadGeometry] = useState([]);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const markerPositions = (Array.isArray(coordinates) ? coordinates : [])
        .map(coord => {
            if (!coord || typeof coord !== 'string' || !coord.includes(',')) return null;
            const parts = coord.split(',');
            return [parseFloat(parts[0]), parseFloat(parts[1])];
        })
        .filter(pos => pos !== null && !isNaN(pos[0]) && !isNaN(pos[1]));

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
                const coordinateStringParam = markerPositions.map(pos => `${pos[1]},${pos[0]}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordinateStringParam}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.code === 'Ok' && data.routes?.[0]) {
                    const route = data.routes[0];
                    setRoadGeometry(route.geometry.coordinates.map(coord => [coord[1], coord[0]]));

                    // FIXED: Forwarding metrics back upwards to parent form container
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

    const handleMapClick = (latlng) => {
        if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') return;
        onCoordinatesChange([...coordinates, `${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`]);
    };

    return (
        <div className="space-y-2 mt-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold h-5 flex items-center">
                {loadingRoute ? <span className="text-blue-400 animate-pulse">⚡ SNAP-ROUTING SYSTEM TO ROAD NETWORKS...</span> : `Interactive Sequence Route Builder (${markerPositions.length} Points Mapped)`}
            </span>
            <div className="h-64 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0">
                <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapEventsHandler onMapClick={handleMapClick} />
                    {markerPositions.map((pos, idx) => <Marker key={idx} position={pos} />)}
                    {roadGeometry.length > 0 && <Polyline positions={roadGeometry} color="#2563eb" weight={3} opacity={0.85} />}
                </MapContainer>
            </div>
        </div>
    );
}
