// /src/app/components/TransportFormFields.jsx
'use client';

import React from 'react';
import DistanceField from './DistanceField';
import VehicleFields from './VehicleFields';
import ShippingFields from './ShippingFields';
import FlightFields from './FlightFields';

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
    searchLoading
}) {
    if (!['vehicle', 'shipping', 'flight'].includes(activeTab)) return null;

    return (
        <>
            {/* Render universal distance layout fields on surface vehicle track frames */}
            {['vehicle', 'shipping'].includes(activeTab) && (
                <DistanceField
                    distance={distance} setDistance={setDistance}
                    unit={unit} setUnit={setUnit}
                />
            )}

            {activeTab === 'vehicle' && (
                <VehicleFields
                    customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle}
                    setSelectedCustomVehicle={setSelectedCustomVehicle}
                    openDropdownKey={openDropdownKey}
                    setOpenDropdownKey={setOpenDropdownKey}
                />
            )}

            {activeTab === 'shipping' && (
                <ShippingFields
                    weight={weight} setWeight={setWeight}
                    weightUnit={weightUnit} setWeightUnit={setWeightUnit}
                />
            )}

            {activeTab === 'flight' && (
                <FlightFields
                    depAirport={depAirport} setDepAirport={setDepAirport}
                    destAirport={destAirport} setDestAirport={setDestAirport}
                    passengers={passengers} setPassengers={setPassengers}
                    openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                    originAirportsList={originAirportsList} destAirportsList={destAirportsList}
                    onSearchAirports={onSearchAirports} searchLoading={searchLoading}
                />
            )}
        </>
    );
}
