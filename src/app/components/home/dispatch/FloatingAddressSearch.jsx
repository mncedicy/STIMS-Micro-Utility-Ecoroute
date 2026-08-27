// src/app/components/home/dispatch/FloatingAddressSearch.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

export default function FloatingAddressSearch({ mapInstance, handleMapClick }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFetch = setTimeout(async () => {
            setSearching(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=za&limit=5`;
                const res = await fetch(url, {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent': 'EcoRouteLogisticsCalculator/1.0 (https://stims.co.za)'
                    }
                });
                const data = await res.json();
                setSearchResults(data || []);
                setShowDropdown(true);
            } catch (err) {
                console.error('[Nominatim Address Search Exception]:', err);
            } finally {
                setSearching(false);
            }
        }, 450);

        return () => clearTimeout(delayDebounceFetch);
    }, [searchQuery]);

    const handleSelectAddress = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        if (isNaN(lat) || isNaN(lon)) return;

        handleMapClick({ lat, lng: lon });
        setSearchQuery('');
        setShowDropdown(false);

        if (mapInstance?.current) {
            mapInstance.current.setView([lat, lon], 14, { animate: true });
        }
    };

    return (
        /* 
           - Replaced rigid absolute offsets with a fluid layout 'w-full'.
           - dropdown results container is kept at a high 'z-50' stacking level 
             so that it rolls cleanly over header borders and maps.
        */
        <div className="w-full relative font-sans text-xs">
            <div className="relative flex items-center bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 group focus-within:border-blue-500/50 transition-colors">
                {searching ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin mr-2 shrink-0" />
                ) : (
                    <Search className="w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 mr-2 shrink-0" />
                )}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 3 && setShowDropdown(true)}
                    placeholder="Type logistics address..."
                    className="w-full bg-transparent border-none text-white outline-none placeholder:text-slate-600 text-[11px]"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-500 hover:text-slate-300 bg-transparent border-none text-[10px] cursor-pointer pl-1"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Dropdown Suggestions List Panel Overlay */}
            {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#090d22] border border-slate-800 rounded-lg shadow-2xl overflow-y-auto max-h-48 z-50 divide-y divide-slate-900/60">
                    {searchResults.map((result) => (
                        <div
                            key={result.place_id}
                            onClick={() => handleSelectAddress(result)}
                            className="flex items-start gap-2 p-2 hover:bg-blue-600/10 cursor-pointer text-slate-300 hover:text-white transition-colors duration-150"
                        >
                            <MapPin className="w-3.5 h-3.5 text-blue-500/70 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight truncate">{result.display_name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Dropdown Empty Placeholder Alert */}
            {showDropdown && searchQuery.trim().length >= 3 && searchResults.length === 0 && !searching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#090d22] border border-slate-800 rounded-lg p-2 text-center text-[10px] text-slate-500 shadow-xl z-50">
                    No regional destination hubs resolved.
                </div>
            )}
        </div>
    );
}
