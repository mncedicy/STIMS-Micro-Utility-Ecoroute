// src/app/components/home/dispatch/TransportFormFields.jsx

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import DistanceField from './DistanceField';
import VehicleFields from './VehicleFields';
import ShippingFields from './ShippingFields';
import FlightFields from './FlightFields';

const MapCoordinatePicker = dynamic(
    () => import('./MapCoordinatePicker'),
    { ssr: false, loading: () => <div className="h-64 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-[10px] font-mono">HYDRATING TELEMETRY CANVAS...</div> }
);

export default function TransportFormFields({
    activeTab,
    distance, setDistance,
    unit, setUnit,
    customVehicles,
    selectedCustomVehicle, setSelectedCustomVehicle,
    weight, setWeight,
    weightUnit, setWeightUnit,
    depAirport, setDepAirport,
    destAirport, setDestAirport,
    passengers, setPassengers,
    openDropdownKey, setOpenDropdownKey,
    originAirportsList = [],
    destAirportsList = [],
    onSearchAirports,
    searchLoading,
    routeCoordinates = [],
    setRouteCoordinates,
    taxStartDate,
    setTaxStartDate,
    taxEndDate,
    setTaxEndDate,
    maxDateBoundary
}) {
    if (!['vehicle', 'shipping', 'flight', 'route', 'tax'].includes(activeTab)) return null;

    return (
        <>
            {activeTab === 'vehicle' && (
                <div className="space-y-3 animate-fade-in">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                        📊 Fleet asset carbon emissions intensity calculator
                    </p>
                    <DistanceField
                        distance={distance} setDistance={setDistance}
                        unit={unit} setUnit={setUnit}
                    />
                    <VehicleFields
                        customVehicles={customVehicles}
                        selectedCustomVehicle={selectedCustomVehicle}
                        setSelectedCustomVehicle={setSelectedCustomVehicle}
                        openDropdownKey={openDropdownKey}
                        setOpenDropdownKey={setOpenDropdownKey}
                    />
                </div>
            )}

            {activeTab === 'shipping' && (
                <div className="space-y-3 animate-fade-in">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                        📊 Cargo weight freight logistics calculator
                    </p>
                    <DistanceField
                        distance={distance} setDistance={setDistance}
                        unit={unit} setUnit={setUnit}
                    />
                    <ShippingFields
                        weight={weight} setWeight={setWeight}
                        weightUnit={weightUnit} setWeightUnit={setWeightUnit}
                    />
                </div>
            )}

            {activeTab === 'flight' && (
                <div className="space-y-3 animate-fade-in">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                        📊 Commercial aviation sector passenger tracker
                    </p>
                    <FlightFields
                        depAirport={depAirport} setDepAirport={setDepAirport}
                        destAirport={destAirport} setDestAirport={setDestAirport}
                        passengers={passengers} setPassengers={setPassengers}
                        openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                        originAirportsList={originAirportsList} destAirportsList={destAirportsList}
                        onSearchAirports={onSearchAirports} searchLoading={searchLoading}
                    />
                </div>
            )}

            {activeTab === 'route' && (
                <div className="space-y-3 animate-fade-in">
                    <h4 className="text-blue-500 text-[10px] font-mono font-black tracking-wider uppercase mb-1">
                        📍 SEQUENTIAL HAVERSINE TRANSIT WAYPOINT ROUTE CHECKER MATRIX
                    </h4>
                    <VehicleFields
                        customVehicles={customVehicles}
                        selectedCustomVehicle={selectedCustomVehicle}
                        setSelectedCustomVehicle={setSelectedCustomVehicle}
                        openDropdownKey={openDropdownKey}
                        setOpenDropdownKey={setOpenDropdownKey}
                    />
                    <MapCoordinatePicker
                        coordinates={routeCoordinates}
                        onCoordinatesChange={setRouteCoordinates}
                    />
                </div>
            )}

            {activeTab === 'tax' && (
                <div className="space-y-3 animate-fade-in font-mono text-xs mt-1">
                    <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans normal-case">
                        <strong className="text-blue-400 font-mono text-[10px] tracking-wider uppercase block mb-1">
                            📊 SARS Carbon Tax Compliance Ledger
                        </strong>
                        This evaluation module compiles all recorded fleet logistics, shipping, flight, and industrial energy audit log points across your selected date window.
                        It evaluates aggregate environmental volume, applies the standard <strong className="text-slate-200">60% basic free tax exemption allowance</strong> baseline factor automatically, and structures your organization's statutory ZAR liability forecaster.
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">ANALYSIS START DATE</label>
                            <input
                                type="date"
                                value={taxStartDate}
                                onChange={(e) => setTaxStartDate(e.target.value)}
                                max={maxDateBoundary}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">ANALYSIS END DATE</label>
                            <input
                                type="date"
                                value={taxEndDate}
                                onChange={(e) => setTaxEndDate(e.target.value)}
                                max={maxDateBoundary}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
