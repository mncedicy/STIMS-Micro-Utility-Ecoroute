// src/app/components/home/dispatch/DispatchForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import TransportFormFields from './TransportFormFields';
import UtilityFormFields from './UtilityFormFields';
import TabSelector from './TabSelector';
import AuditSubmitButton from './AuditSubmitButton';
import useAirportSearch from '../../../hooks/useAirportSearch';
import { supabase } from '../../../lib/supabaseClient';
import { getFormInitialDates } from '../../../utils/dateHelpers';
import { processFormSubmission } from '../../../utils/formSubmitHandler';

export default function DispatchForm({
    distance, setDistance, unit, setUnit, onSubmit, loading,
    customVehicles, selectedCustomVehicle, setSelectedCustomVehicle, setModal
}) {
    const [activeTab, setActiveTab] = useState('vehicle');
    const { todayString, defaultStartMonthString } = getFormInitialDates();

    // Input States Context
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');
    const [shippingMode, setShippingMode] = useState('standard');
    const [depAirport, setDepAirport] = useState('');
    const [destAirport, setDestAirport] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [flightClass, setFlightClass] = useState('economy');
    const [electricityKwh, setElectricityKwh] = useState('');
    const [powerSource, setPowerSource] = useState('utility_grid'); // Injected advanced electricity source state hook
    const [countryCode, setCountryCode] = useState('ZA');
    const [gasQuantity, setGasQuantity] = useState('');
    const [gasType, setGasType] = useState('NATURAL_GAS');
    const [gasUnit, setGasUnit] = useState('m3');

    // Route & Tax States Matrix
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    // OSRM Metadata Tracking Matrix Contexts
    const [osrmTotalDuration, setOsrmTotalDuration] = useState(0);
    const [osrmLegsData, setOsrmLegsData] = useState([]);
    const [osrmWaypointsData, setOsrmWaypointsData] = useState([]);

    const [taxStartDate, setTaxStartDate] = useState(defaultStartMonthString);
    const [taxEndDate, setTaxEndDate] = useState(todayString);
    const [emissionDate, setEmissionDate] = useState(todayString);

    const [openDropdownKey, setOpenDropdownKey] = useState(null);
    const [dbCountriesList, setDbCountriesList] = useState([]);

    const triggerDialogAlert = (msg) => {
        if (setModal) {
            setModal({ isOpen: true, status: 'red', title: 'VALIDATION FAULT', message: msg, hasCancel: false });
        }
    };

    const { originAirportsList = [], destAirportsList = [], searchLoading = false, fetchAirportsFromDatabase } = useAirportSearch(activeTab) || {};

    useEffect(() => {
        const fetchCountriesFromDatabase = async () => {
            try {
                const { data, error } = await supabase.from('ecoroute_static_countries').select('code, name').order('name', { ascending: true });
                if (!error && data) setDbCountriesList(data);
            } catch (err) {
                console.error('[Static Country Hydration Exception]:', err);
            }
        };
        fetchCountriesFromDatabase();
    }, []);

    const handleTabChange = (targetTab) => {
        setActiveTab(targetTab);
        setOpenDropdownKey(null);

        setOsrmTotalDuration(0);
        setOsrmLegsData([]);
        setOsrmWaypointsData([]);
        setRouteCoordinates([]);
        setDistance('');
        setWeight('');
        setShippingMode('standard');
        setDepAirport('');
        setDestAirport('');
        setFlightClass('economy');
        setElectricityKwh('');
        setPowerSource('utility_grid'); // Wipes choices back cleanly to default configuration on cross tab actions
        setGasQuantity('');
    };

    const handleFormSubmit = (e) => {
        processFormSubmission({
            e, activeTab, emissionDate, todayString, distance, unit, selectedCustomVehicle,
            weight, weightUnit, shippingMode, depAirport, destAirport, passengers, flightClass,
            countryCode, electricityKwh, powerSource, gasQuantity, gasType, gasUnit, routeCoordinates,
            taxStartDate, taxEndDate, osrmTotalDuration, osrmLegsData, osrmWaypointsData,
            triggerDialogAlert, onSubmit
        });
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative group">
            <TabSelector activeTab={activeTab} setActiveTab={handleTabChange} setOpenDropdownKey={setOpenDropdownKey} />

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
                <TransportFormFields
                    activeTab={activeTab} distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit}
                    customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle}
                    weight={weight} setWeight={setWeight} weightUnit={weightUnit} setWeightUnit={setWeightUnit}
                    depAirport={depAirport} setDepAirport={setDepAirport} destAirport={destAirport} setDestAirport={setDestAirport} passengers={passengers} setPassengers={setPassengers}
                    openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                    originAirportsList={originAirportsList} destAirportsList={destAirportsList}
                    onSearchAirports={fetchAirportsFromDatabase} searchLoading={searchLoading}
                    routeCoordinates={routeCoordinates} setRouteCoordinates={setRouteCoordinates}
                    taxStartDate={taxStartDate} setTaxStartDate={setTaxStartDate} taxEndDate={taxEndDate} setTaxEndDate={setTaxEndDate}
                    maxDateBoundary={todayString} setOsrmTotalDuration={setOsrmTotalDuration} setOsrmLegsData={setOsrmLegsData} setOsrmWaypointsData={setOsrmWaypointsData}
                    shippingMode={shippingMode} setShippingMode={setShippingMode}
                    flightClass={flightClass} setFlightClass={setFlightClass}
                />

                <UtilityFormFields
                    activeTab={activeTab} electricityKwh={electricityKwh} setElectricityKwh={setElectricityKwh}
                    countryCode={countryCode} setCountryCode={setCountryCode} gasQuantity={gasQuantity} setGasQuantity={setGasQuantity}
                    gasType={gasType} setGasType={setGasType} gasUnit={gasUnit} setGasUnit={setGasUnit}
                    dbCountriesList={dbCountriesList} openDropdownKey={openDropdownKey} setOpenDropdownKey={setOpenDropdownKey}
                    powerSource={powerSource} setPowerSource={setPowerSource} // Correctly wired down to panel layer fields row
                />

                {!['tax', 'route'].includes(activeTab) && (
                    <div className="pt-2 border-t border-slate-900/40">
                        <label className="block text-slate-500 mb-1 text-[10px] uppercase tracking-widest font-bold">EMISSION OPERATION DATE</label>
                        <input type="date" value={emissionDate} onChange={(e) => setEmissionDate(e.target.value)} max={todayString} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 font-mono text-xs" required />
                    </div>
                )}

                <AuditSubmitButton loading={loading} />
            </form>
        </div>
    );
}
