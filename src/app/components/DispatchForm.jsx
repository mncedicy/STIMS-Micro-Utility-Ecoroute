'use client';

import React, { useState, useEffect } from 'react';
import TransportFormFields from './TransportFormFields';
import UtilityFormFields from './UtilityFormFields';
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

    // SEARCHABLE DROPDOWN & DYNAMIC DATA SETS
    const [openDropdownKey, setOpenDropdownKey] = useState(null);
    const [dbAirportsList, setDbAirportsList] = useState([]);
    const [dbCountriesList, setDbCountriesList] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // ASYNCHRONOUS AIRPORT LIVE STREAM RETRIEVAL
    const fetchAirportsFromDatabase = async (inputQuery = '') => {
        setSearchLoading(true);
        try {
            let baseQuery = supabase
                .from('ecoroute_static_airports')
                .select('id, name, iso_country, municipality, latitude, longitude')
                .order('name', { ascending: true })
                .limit(30);

            if (inputQuery.trim().length > 0) {
                baseQuery = baseQuery.or(`name.ilike.%${inputQuery}%,municipality.ilike.%${inputQuery}%,iso_country.ilike.%${inputQuery}%`);
            }

            const { data, error } = await baseQuery;
            if (!error && data) {
                setDbAirportsList(data);
            }
        } catch (err) {
            console.error('[Live Airport Search Exception]:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    // ASYNCHRONOUS COUNTRY DICTIONARY HYDRATION
    const fetchCountriesFromDatabase = async () => {
        try {
            const { data, error } = await supabase
                .from('ecoroute_static_countries')
                .select('code, name')
                .order('name', { ascending: true });

            if (!error && data) {
                setDbCountriesList(data);
                // Intelligently map the initial selected country code context if verified rows are available
                if (data.length > 0 && !data.some(c => c.code === countryCode)) {
                    setCountryCode(data[0].code);
                }
            }
        } catch (err) {
            console.error('[Static Country Hydration Exception]:', err);
        }
    };

    // Hydrate database assets concurrently on module entry
    useEffect(() => {
        fetchCountriesFromDatabase();
    }, []);

    useEffect(() => {
        if (activeTab === 'flight') {
            fetchAirportsFromDatabase('');
        }
    }, [activeTab]);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (activeTab === 'vehicle') {
            if (!selectedCustomVehicle || selectedCustomVehicle === '') {
                alert('⚠️ Please select a valid vehicle from your active fleet registration list.');
                return;
            }
            onSubmit({
                type: 'vehicle',
                distance: distance.toString(),
                unit,
                vehicle_id: selectedCustomVehicle
            });
        } else if (activeTab === 'shipping') {
            onSubmit({
                type: 'shipping',
                distance: distance.toString(),
                unit,
                cargo_weight: weight.toString(),
                mass_unit: weightUnit
            });
        } else if (activeTab === 'flight') {
            if (!depAirport || !destAirport) {
                alert('⚠️ Please select valid origin and destination terminals from the database dropdown.');
                return;
            }

            if (depAirport === destAirport) {
                alert('⚠️ Flight origin and destination cannot match the same terminal location.');
                return;
            }

            onSubmit({
                type: 'flight',
                passengers: passengers.toString(),
                origin_iata: depAirport.trim(),
                dest_iata: destAirport.trim()
            });
        } else if (activeTab === 'electricity') {
            if (!countryCode || countryCode === '') {
                alert('⚠️ Please select a valid target grid region country.');
                return;
            }
            onSubmit({
                type: 'electricity',
                kwh: electricityKwh.toString(),
                country_code: countryCode.trim().toUpperCase()
            });
        } else if (activeTab === 'gas') {
            onSubmit({
                type: 'gas',
                quantity: gasQuantity.toString(),
                gas_type: gasType,
                gas_unit: gasUnit
            });
        }
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative group">
            <div className="w-full grid grid-cols-5 gap-1 border-b border-slate-800 pb-3 mb-4 font-mono text-[10px]">
                {['vehicle', 'shipping', 'flight', 'electricity', 'gas'].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => {
                            setActiveTab(tab);
                            setOpenDropdownKey(null); // Dismiss open fields across tab changes cleanly
                        }}
                        className={`text-center py-1.5 rounded-md uppercase tracking-wider transition-colors cursor-pointer w-full text-ellipsis overflow-hidden ${activeTab === tab
                            ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
                <TransportFormFields
                    activeTab={activeTab}
                    distance={distance}
                    setDistance={setDistance}
                    unit={unit}
                    setUnit={setUnit}
                    customVehicles={customVehicles}
                    selectedCustomVehicle={selectedCustomVehicle}
                    setSelectedCustomVehicle={setSelectedCustomVehicle}
                    weight={weight}
                    setWeight={setWeight}
                    weightUnit={weightUnit}
                    setWeightUnit={setWeightUnit}
                    depAirport={depAirport}
                    setDepAirport={setDepAirport}
                    destAirport={destAirport}
                    setDestAirport={setDestAirport}
                    passengers={passengers}
                    setPassengers={setPassengers}
                    openDropdownKey={openDropdownKey}
                    setOpenDropdownKey={setOpenDropdownKey}
                    dbAirportsList={dbAirportsList}
                    onSearchAirports={fetchAirportsFromDatabase}
                    searchLoading={searchLoading}
                />

                <UtilityFormFields
                    activeTab={activeTab}
                    electricityKwh={electricityKwh}
                    setElectricityKwh={setElectricityKwh}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                    gasQuantity={gasQuantity}
                    setGasQuantity={setGasQuantity}
                    gasType={gasType}
                    setGasType={setGasType}
                    gasUnit={gasUnit}
                    setGasUnit={setGasUnit}
                    dbCountriesList={dbCountriesList}
                    openDropdownKey={openDropdownKey}
                    setOpenDropdownKey={setOpenDropdownKey}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all uppercase text-[11px] tracking-widest disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] stims-hover-glow cursor-pointer text-center"
                >
                    {loading ? 'CALCULATING EMISSIONS...' : 'EXECUTE LOGISTICS AUDIT'}
                </button>
            </form>
        </div>
    );
}
