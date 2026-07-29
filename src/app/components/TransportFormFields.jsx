'use client';

import React from 'react';
import SearchableDropdownField from './SearchableDropdownField';

export default function TransportFormFields({
    activeTab,
    distance,
    setDistance,
    unit,
    setUnit,
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle,
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    depAirport,
    setDepAirport,
    destAirport,
    setDestAirport,
    passengers,
    setPassengers,
    openDropdownKey,
    setOpenDropdownKey,
    dbAirportsList = [],
    onSearchAirports,
    searchLoading
}) {
    if (!['vehicle', 'shipping', 'flight'].includes(activeTab)) return null;

    const selectedCarNode = customVehicles?.find(v => v.id === selectedCustomVehicle);
    const vehicleDisplayLabel = selectedCarNode
        ? `[${selectedCarNode.registration_number || 'N/A'}] ${selectedCarNode.make} ${selectedCarNode.model} (${selectedCarNode.year})`
        : '';

    // LOOK UP CORRESPONDING LABELS VIA UNIQUE ID KEYS NATIVELY:
    const selectedOriginNode = dbAirportsList?.find(a => a.id?.toString() === depAirport?.toString() || a.name === depAirport);
    const originDisplayLabel = selectedOriginNode
        ? `${selectedOriginNode.name} (${selectedOriginNode.municipality || 'N/A'}, ${selectedOriginNode.iso_country})`
        : depAirport;

    const selectedDestNode = dbAirportsList?.find(a => a.id?.toString() === destAirport?.toString() || a.name === destAirport);
    const destDisplayLabel = selectedDestNode
        ? `${selectedDestNode.name} (${selectedDestNode.municipality || 'N/A'}, ${selectedDestNode.iso_country})`
        : destAirport;

    return (
        <>
            {/* DISTANCE FIELDS TRACKS */}
            {['vehicle', 'shipping'].includes(activeTab) && (
                /* MODIFIED: Swapped layout from grid-cols-3 to grid-cols-2 for symmetrical split rows */
                <div className="grid grid-cols-2 gap-2 font-mono text-xs items-end">
                    {/* MODIFIED: Removed col-span-2 to ensure equal 50% width balancing layout parameters */}
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">DISTANCE</label>
                        <input
                            type="number"
                            step="any"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">UNIT</label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]"
                        >
                            <option value="km">KM</option>
                            <option value="miles">MILES</option>
                        </select>
                    </div>
                </div>
            )}

            {/* SEARCHABLE FLEET VEHICLE SELECTOR */}
            {activeTab === 'vehicle' && (
                <div className="relative">
                    <SearchableDropdownField
                        label="SELECT FLEET ASSET"
                        placeholder="-- CHOOSE VEHICLE FROM REGISTER --"
                        valueDisplay={vehicleDisplayLabel}
                        searchPlaceholder="Filter fleet by registration, make, or year..."
                        items={customVehicles || []}
                        isOpen={openDropdownKey === 'vehicle'}
                        onToggle={() => setOpenDropdownKey(openDropdownKey === 'vehicle' ? null : 'vehicle')}
                        onSelect={(car) => setSelectedCustomVehicle(car.id)}
                        renderItem={(car) => `[${car.registration_number || 'N/A'}] ${car.make} ${car.model} (${car.year})`}
                    />
                </div>
            )}

            {/* SHIPPING FIELDS TRACKS */}
            {activeTab === 'shipping' && (
                /* MODIFIED: Swapped layout from grid-cols-3 to grid-cols-2 for symmetrical split rows */
                <div className="grid grid-cols-2 gap-2 animate-fade-in font-mono text-xs items-end">
                    {/* MODIFIED: Removed col-span-2 to ensure equal 50% width balancing layout parameters */}
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">CARGO WEIGHT</label>
                        <input
                            type="number"
                            step="any"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">MASS UNIT</label>
                        <select
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs h-[34px]"
                        >
                            <option value="kg">KG</option>
                            <option value="lbs">LBS</option>
                            <option value="tonnes">TONNES</option>
                        </select>
                    </div>
                </div>
            )}

            {/* AVIATION FLIGHT FIELDS TRACKS */}
            {activeTab === 'flight' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <SearchableDropdownField
                                label="ORIGIN AIRPORT"
                                placeholder={searchLoading ? "Loading database..." : "Search name, town or country..."}
                                valueDisplay={originDisplayLabel}
                                searchPlaceholder="Type airport name, municipality, or country..."
                                items={dbAirportsList}
                                isOpen={openDropdownKey === 'origin'}
                                onToggle={() => setOpenDropdownKey(openDropdownKey === 'origin' ? null : 'origin')}
                                onSelect={(airport) => setDepAirport(airport.id.toString())}
                                renderItem={(airport) => `${airport.name} (${airport.municipality || 'N/A'}, ${airport.iso_country})`}
                            />
                        </div>
                        <div className="relative">
                            <SearchableDropdownField
                                label="DESTINATION AIRPORT"
                                placeholder={searchLoading ? "Loading database..." : "Search name, town or country..."}
                                valueDisplay={destDisplayLabel}
                                searchPlaceholder="Type airport name, municipality, or country..."
                                items={dbAirportsList}
                                isOpen={openDropdownKey === 'dest'}
                                onToggle={() => setOpenDropdownKey(openDropdownKey === 'dest' ? null : 'dest')}
                                onSelect={(airport) => setDestAirport(airport.id.toString())}
                                renderItem={(airport) => `${airport.name} (${airport.municipality || 'N/A'}, ${airport.iso_country})`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">PASSENGERS COUNT</label>
                        <input type="number" min={1} value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono" required />
                    </div>
                </div>
            )}
        </>
    );
}
