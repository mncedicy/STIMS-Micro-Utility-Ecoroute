// src/app/components/home/dispatch/MapCoordinatePicker.jsx

'use client';

import React from 'react';
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

function MapEventsHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

export default function MapCoordinatePicker({ coordinates, onCoordinatesChange }) {
    const defaultCenter = [-26.02, 28.22]; // Defaulting to South Africa region baseline bounds

    const handleMapClick = (latlng) => {
        if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') return;
        const coordinateString = `${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`;
        onCoordinatesChange([...coordinates, coordinateString]);
    };

    const clearPoints = () => {
        onCoordinatesChange([]);
    };

    // FIXED PARSING MATRIX: Explicitly selects index offsets and to pull numerical values cleanly
    const polylinePositions = (Array.isArray(coordinates) ? coordinates : [])
        .map(coord => {
            if (!coord || typeof coord !== 'string' || !coord.includes(',')) return null;
            const parts = coord.split(',');
            const lat = parseFloat(parts[0]); // FIXED: Reads array index position 0 safely
            const lon = parseFloat(parts[1]); // FIXED: Reads array index position 1 safely
            return (!isNaN(lat) && !isNaN(lon)) ? [lat, lon] : null;
        })
        .filter(pos => pos !== null); // Discards malformed node metrics instantly

    return (
        <div className="space-y-2 mt-2 font-mono text-xs">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    Interactive Sequence Route Builder ({polylinePositions.length} Points Selected)
                </span>
                {polylinePositions.length > 0 && (
                    <button
                        type="button"
                        onClick={clearPoints}
                        className="text-rose-400 hover:text-rose-300 text-[10px] uppercase font-bold cursor-pointer"
                    >
                        [ Clear Path ]
                    </button>
                )}
            </div>

            <div className="h-64 w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative z-0">
                <MapContainer
                    center={defaultCenter} // FIXED: Pins map center context, preventing cursor drift movement jumps
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEventsHandler onMapClick={handleMapClick} />

                    {polylinePositions.map((pos, idx) => (
                        <Marker key={idx} position={pos} />
                    ))}

                    {polylinePositions.length > 1 && (
                        <Polyline positions={polylinePositions} color="#2563eb" weight={3} dashArray="5, 10" />
                    )}
                </MapContainer>
            </div>
            <p className="text-[10px] text-slate-500 italic">
                💡 Click directly on the map surface panel above sequentially to plot logistics waypoint paths.
            </p>
        </div>
    );
}
