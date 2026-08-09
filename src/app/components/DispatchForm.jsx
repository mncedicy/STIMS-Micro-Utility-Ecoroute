// /src/app/components/DispatchForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import TransportFormFields from './TransportFormFields';
import UtilityFormFields from './UtilityFormFields';
import TabSelector from './TabSelector';
import AuditSubmitButton from './AuditSubmitButton';
import useAirportSearch from '../hooks/useAirportSearch';
import { supabase } from '../lib/supabaseClient';

export default function DispatchForm({
    distance,
    setDistance,
    unit,
    setUnit,
    onSubmit,
    loading,
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle
}) {
    const [activeTab, setActiveTab] = useState('vehicle');

    // Input States Context
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');
    const [depAirport, setDepAirport] = useState('');
    const [destAirport, setDestAirport] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [electricityKwh, setElectricityKwh] = useState('');
    const [countryCode, setCountryCode] = useState('ZA');
    const [gasQuantity, setGasQuantity] = useState('');
    const [gasType, setGasType] = useState('NATURAL_GAS');
    const [gasUnit, setGasUnit] = useState('m3');

    const todayString = new Date().toISOString().split('T')[0];
    const [emissionDate, setEmissionDate] = useState(todayString);

    // Interface layout tracking triggers
    const [openDropdownKey, setOpenDropdownKey] = useState(null);
    const [dbCountriesList, setDbCountriesList] = useState([]);

    const {
        originAirportsList,
        destAirportsList,
        searchLoading,
        fetchAirportsFromDatabase
    } = useAirportSearch(activeTab);

    useEffect(() => {
        const fetchCountriesFromDatabase = async () => {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_countries')
                    .select('code, name')
                    .order('name', { ascending: true });

                if (!error && data) {
                    setDbCountriesList(data);
                    if (data.length > 0 && !data.some(c => c.code === countryCode)) {
                        setCountryCode(data[0].code);
                    }
                }
            } catch (err) {
                console.error('[Static Country Hydration Exception]:', err);
            }
        };
        fetchCountriesFromDatabase();
    }, []);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // FIXED INTERFACE VALIDATION: Prevent submissions if raw state falls outside current bounds
        if (emissionDate > todayString) {
            return alert(`⚠️ Operational Constraint: Selected entry date cannot be in the future. Max allowed date is ${todayString}.`);
        }

        const trackingPayload = { emission_date: emissionDate };

        if (activeTab === 'vehicle') {
            if (!selectedCustomVehicle) return alert('⚠️ Please select a valid vehicle from your active fleet registration list.');
            onSubmit({ ...trackingPayload, type: 'vehicle', distance: distance.toString(), unit, vehicle_id: selectedCustomVehicle });
        } else if (activeTab === 'shipping') {
            onSubmit({ ...trackingPayload, type: 'shipping', distance: distance.toString(), unit, cargo_weight: weight.toString(), mass_unit: weightUnit });
        } else if (activeTab === 'flight') {
            if (!depAirport || !destAirport) return alert('⚠️ Please select valid origin and destination terminals from the database dropdown.');
            if (depAirport === destAirport) return alert('⚠️ Flight origin and destination cannot match the same terminal location.');
            onSubmit({ ...trackingPayload, type: 'flight', passengers: passengers.toString(), origin_iata: depAirport.trim(), dest_iata: destAirport.trim() });
        } else if (activeTab === 'electricity') {
            if (!countryCode) return alert('⚠️ Please select a valid target grid region country.');
            onSubmit({ ...trackingPayload, type: 'electricity', kwh: electricityKwh.toString(), country_code: countryCode.trim().toUpperCase() });
        } else if (activeTab === 'gas') {
            onSubmit({ ...trackingPayload, type: 'gas', quantity: gasQuantity.toString(), gas_type: gasType, gas_unit: gasUnit });
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative group">
            <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} setOpenDropdownKey={setOpenDropdownKey} />

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
                <TransportFormFields
                    activeTab={activeTab}
                    distance={distance} setDistance={setDistance}
                    unit={unit} setUnit={setUnit}
                    customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle}
                    weight={weight} setWeight={setWeight}
                    weightUnit={weightUnit} setWeightUnit={setWeightUnit}
                    depAirport={depAirport} setDepAirport={setDepAirport}
                    destAirport={destAirport} setDestAirport={setDestAirport}
                    passengers={passengers} setPassengers={setPassengers}
                    openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                    originAirportsList={originAirportsList} destAirportsList={destAirportsList}
                    onSearchAirports={fetchAirportsFromDatabase} searchLoading={searchLoading}
                />

                <UtilityFormFields
                    activeTab={activeTab}
                    electricityKwh={electricityKwh} setElectricityKwh={setElectricityKwh}
                    countryCode={countryCode} setCountryCode={setCountryCode}
                    gasQuantity={gasQuantity} setGasQuantity={setGasQuantity}
                    gasType={gasType} setGasType={setGasType}
                    gasUnit={gasUnit} setGasUnit={setGasUnit}
                    dbCountriesList={dbCountriesList}
                    openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                />

                <div className="pt-2 border-t border-slate-900/40">
                    <label className="block text-slate-500 mb-1 text-[10px] uppercase tracking-widest font-bold">EMISSION OPERATION DATE</label>
                    <input
                        type="date"
                        value={emissionDate}
                        onChange={(e) => setEmissionDate(e.target.value)}
                        max={todayString} // FIXED: Injected strict browser calendar max limitation boundary
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-xs"
                        required
                    />
                </div>

                <AuditSubmitButton loading={loading} />
            </form>
        </div>
    );
}
