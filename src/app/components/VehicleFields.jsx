// /src/app/components/VehicleFields.jsx
'use client';

import React from 'react';
import SearchableDropdownField from './SearchableDropdownField';

export default function VehicleFields({
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle,
    openDropdownKey,
    setOpenDropdownKey
}) {
    const selectedCarNode = customVehicles?.find(v => v.id === selectedCustomVehicle);
    const vehicleDisplayLabel = selectedCarNode
        ? `[${selectedCarNode.registration_number || 'N/A'}] ${selectedCarNode.make} ${selectedCarNode.model} (${selectedCarNode.year})`
        : '';

    return (
        <div className="relative mt-3">
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
    );
}
