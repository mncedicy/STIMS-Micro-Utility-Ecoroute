// src\app\components\home\dispatch\FlightFields.jsx

'use client';

import React from 'react';
import SearchableDropdownField from '../../shared/SearchableDropdownField';

export default function FlightFields({
    depAirport,
    setDepAirport,
    destAirport,
    setDestAirport,
    passengers,
    setPassengers,
    openDropdownKey,
    setOpenDropdownKey,
    originAirportsList,
    destAirportsList,
    onSearchAirports,
    searchLoading
}) {
    const cleanAirportName = (name = '') => {
        return name
            .replace(/^([\[(])(delete|duplicate|old).*?([\])])\s*/gi, '')
            .replace(/^\(delete\)|^\(duplicate.*?\)/gi, '')
            .trim();
    };

    const filterValidAirports = (list = []) => {
        return list.filter(a => {
            const lowerName = (a.name || '').toLowerCase();
            return !lowerName.includes('delete') && !lowerName.includes('duplicate');
        });
    };

    const validOriginList = filterValidAirports(originAirportsList);
    const validDestList = filterValidAirports(destAirportsList);

    const selectedOriginNode = originAirportsList?.find(a => a.id?.toString() === depAirport?.toString() || a.name === depAirport);
    const originDisplayLabel = selectedOriginNode
        ? `${cleanAirportName(selectedOriginNode.name)}, ${selectedOriginNode.iso_country}, ${selectedOriginNode.municipality || 'N/A'}`
        : depAirport;

    const selectedDestNode = destAirportsList?.find(a => a.id?.toString() === destAirport?.toString() || a.name === destAirport);
    const destDisplayLabel = selectedDestNode
        ? `${cleanAirportName(selectedDestNode.name)}, ${selectedDestNode.iso_country}, ${selectedDestNode.municipality || 'N/A'}`
        : destAirport;

    return (
        <div className="space-y-3 animate-fade-in mt-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <SearchableDropdownField
                        label="ORIGIN AIRPORT"
                        placeholder={searchLoading ? "Loading database..." : "Search name, town or country..."}
                        valueDisplay={originDisplayLabel}
                        searchPlaceholder="Type airport name, municipality, or country..."
                        items={validOriginList}
                        isOpen={openDropdownKey === 'origin'}
                        onToggle={() => setOpenDropdownKey(openDropdownKey === 'origin' ? null : 'origin')}
                        onSelect={(airport) => setDepAirport(airport.id.toString())}
                        renderItem={(airport) => `${cleanAirportName(airport.name)}, ${airport.iso_country}, ${airport.municipality || 'N/A'}`}
                        onSearchChange={(q) => onSearchAirports(q, 0, 'origin')}
                        onLoadMore={(q) => onSearchAirports(q, -1, 'origin')}
                        loading={searchLoading}
                    />
                </div>
                <div className="relative">
                    <SearchableDropdownField
                        label="DESTINATION AIRPORT"
                        placeholder={searchLoading ? "Loading database..." : "Search name, town or country..."}
                        valueDisplay={destDisplayLabel}
                        searchPlaceholder="Type airport name, municipality, or country..."
                        items={validDestList}
                        isOpen={openDropdownKey === 'dest'}
                        onToggle={() => setOpenDropdownKey(openDropdownKey === 'dest' ? null : 'dest')}
                        onSelect={(airport) => setDestAirport(airport.id.toString())}
                        renderItem={(airport) => `${cleanAirportName(airport.name)}, ${airport.iso_country}, ${airport.municipality || 'N/A'}`}
                        onSearchChange={(q) => onSearchAirports(q, 0, 'dest')}
                        onLoadMore={(q) => onSearchAirports(q, -1, 'dest')}
                        loading={searchLoading}
                    />
                </div>
            </div>
            <div>
                <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">PASSENGERS COUNT</label>
                <input
                    type="number"
                    min={1}
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    required
                />
            </div>
        </div>
    );
}
