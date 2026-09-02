// src/app/components/fleet/asset/FleetAssetSelectorCascade.jsx

'use client';

import React, { useState, useEffect } from 'react';
import SearchableDropdownField from '../../shared/SearchableDropdownField';

export default function FleetAssetSelectorCascade({
    onSelectedModelChange,
    onVehicleSelected,
    onVehicleSelect,
    onSelect,
    onReset,
    saving = false
}) {
    const [years, setYears] = useState([]);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [options, setOptions] = useState([]);

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    const [openDropdown, setOpenDropdown] = useState(null);

    const [loadingYears, setLoadingYears] = useState(false);
    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingVehicleDetails, setLoadingVehicleDetails] = useState(false);

    // Unified callback dispatcher that safely supports any prop naming convention
    const notifyParent = (vehicle) => {
        if (typeof onSelectedModelChange === 'function') {
            onSelectedModelChange(vehicle);
        }
        if (typeof onVehicleSelected === 'function') {
            onVehicleSelected(vehicle);
        }
        if (typeof onVehicleSelect === 'function') {
            onVehicleSelect(vehicle);
        }
        if (typeof onSelect === 'function') {
            onSelect(vehicle);
        }
    };

    const toggleDropdown = (name) => {
        if (saving) return;
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

    const parseMenuItems = (data) => {
        if (!data || !data.menuItem) return [];
        const items = Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
        return items.filter(Boolean);
    };

    // 1. Fetch available years
    useEffect(() => {
        async function fetchYears() {
            setLoadingYears(true);
            try {
                const res = await fetch('/api/fueleconomy?endpoint=vehicle/menu/year');
                const data = await res.json();
                const items = parseMenuItems(data);

                const yearList = items
                    .map((item) => String(item.value))
                    .sort((a, b) => Number(b) - Number(a));

                setYears(yearList);
            } catch (err) {
                console.error('[FuelEconomy] Failed to load years:', err);
                setYears([]);
            } finally {
                setLoadingYears(false);
            }
        }
        fetchYears();
    }, []);

    // 2. Fetch makes
    useEffect(() => {
        if (!selectedYear) {
            setMakes([]);
            return;
        }

        async function fetchMakes() {
            setLoadingMakes(true);
            try {
                const res = await fetch(`/api/fueleconomy?endpoint=vehicle/menu/make?year=${selectedYear}`);
                const data = await res.json();
                const items = parseMenuItems(data);

                const makeList = items.map((item) => String(item.value)).sort();
                setMakes(makeList);
            } catch (err) {
                console.error('[FuelEconomy] Failed to load makes:', err);
                setMakes([]);
            } finally {
                setLoadingMakes(false);
            }
        }
        fetchMakes();
    }, [selectedYear]);

    // 3. Fetch models
    useEffect(() => {
        if (!selectedYear || !selectedMake) {
            setModels([]);
            return;
        }

        async function fetchModels() {
            setLoadingModels(true);
            try {
                const endpoint = `vehicle/menu/model?year=${selectedYear}&make=${encodeURIComponent(selectedMake)}`;
                const res = await fetch(`/api/fueleconomy?endpoint=${encodeURIComponent(endpoint)}`);
                const data = await res.json();
                const items = parseMenuItems(data);

                const modelList = items.map((item) => String(item.value)).sort();
                setModels(modelList);
            } catch (err) {
                console.error('[FuelEconomy] Failed to load models:', err);
                setModels([]);
            } finally {
                setLoadingModels(false);
            }
        }
        fetchModels();
    }, [selectedYear, selectedMake]);

    // 4. Fetch trim options
    useEffect(() => {
        if (!selectedYear || !selectedMake || !selectedModel) {
            setOptions([]);
            return;
        }

        async function fetchOptions() {
            setLoadingOptions(true);
            try {
                const endpoint = `vehicle/menu/options?year=${selectedYear}&make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`;
                const res = await fetch(`/api/fueleconomy?endpoint=${encodeURIComponent(endpoint)}`);
                const data = await res.json();
                const items = parseMenuItems(data);

                const optionList = items.map((item) => ({
                    label: String(item.text),
                    value: String(item.value)
                }));

                setOptions(optionList);
            } catch (err) {
                console.error('[FuelEconomy] Failed to load options:', err);
                setOptions([]);
            } finally {
                setLoadingOptions(false);
            }
        }
        fetchOptions();
    }, [selectedYear, selectedMake, selectedModel]);

    // 5. Fetch full vehicle specs
    const handleOptionSelect = async (vehicleId) => {
        setSelectedOption(vehicleId);
        setOpenDropdown(null);

        if (!vehicleId) {
            notifyParent(null);
            if (typeof onReset === 'function') onReset();
            return;
        }

        setLoadingVehicleDetails(true);
        try {
            const res = await fetch(`/api/fueleconomy?endpoint=vehicle/${vehicleId}`);
            const data = await res.json();

            const normalizedVehicle = {
                id: data.id,
                year: data.year,
                make: data.make,
                model: data.model,
                cylinder: data.cylinders || 'N/A',
                displ: data.displ ? `${data.displ}L` : 'N/A',
                trany: data.trany || 'Standard',
                drive: data.drive || 'Standard',
                fuel_type: data.fuelType || 'Gasoline',
                fuel_type_1: data.fuelType1 || data.fuelType || 'Gasoline',
                co2_tailpipe_gpm: parseFloat(data.co2TailpipeGpm) || 0,
                comb_mpg: parseFloat(data.comb08) || 0,
                comb_mpg_1: parseFloat(data.comb08) || 0,
                city_mpg: parseFloat(data.city08) || 0,
                hwy_mpg: parseFloat(data.highway08) || 0
            };

            notifyParent(normalizedVehicle);
        } catch (err) {
            console.error('[FuelEconomy] Failed to fetch full specs:', err);
        } finally {
            setLoadingVehicleDetails(false);
        }
    };

    const handleYearChange = (val) => {
        setSelectedYear(val);
        setSelectedMake('');
        setSelectedModel('');
        setSelectedOption('');
        setOpenDropdown(null);
        notifyParent(null);
        if (typeof onReset === 'function') onReset();
    };

    const handleMakeChange = (val) => {
        setSelectedMake(val);
        setSelectedModel('');
        setSelectedOption('');
        setOpenDropdown(null);
        notifyParent(null);
        if (typeof onReset === 'function') onReset();
    };

    const handleModelChange = (val) => {
        setSelectedModel(val);
        setSelectedOption('');
        setOpenDropdown(null);
        notifyParent(null);
        if (typeof onReset === 'function') onReset();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. MODEL YEAR */}
                <SearchableDropdownField
                    label="1. MODEL YEAR"
                    options={years.map((y) => ({ label: String(y), value: String(y) }))}
                    selectedValue={selectedYear}
                    onSelect={handleYearChange}
                    isOpen={openDropdown === 'year'}
                    onToggle={() => toggleDropdown('year')}
                    placeholder={loadingYears ? 'Loading years...' : 'Select Year'}
                    disabled={saving || loadingYears}
                />

                {/* 2. VEHICLE MAKE */}
                <SearchableDropdownField
                    label="2. VEHICLE MAKE"
                    options={makes.map((m) => ({ label: String(m), value: String(m) }))}
                    selectedValue={selectedMake}
                    onSelect={handleMakeChange}
                    isOpen={openDropdown === 'make'}
                    onToggle={() => toggleDropdown('make')}
                    placeholder={loadingMakes ? 'Loading makes...' : 'Select Make'}
                    disabled={saving || !selectedYear || loadingMakes}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 3. VEHICLE MODEL */}
                <SearchableDropdownField
                    label="3. VEHICLE MODEL"
                    options={models.map((mod) => ({ label: String(mod), value: String(mod) }))}
                    selectedValue={selectedModel}
                    onSelect={handleModelChange}
                    isOpen={openDropdown === 'model'}
                    onToggle={() => toggleDropdown('model')}
                    placeholder={loadingModels ? 'Loading models...' : 'Select Model'}
                    disabled={saving || !selectedMake || loadingModels}
                />

                {/* 4. ENGINE & TRANSMISSION SPEC */}
                <SearchableDropdownField
                    label="4. ENGINE & TRANSMISSION SPEC"
                    options={options}
                    selectedValue={selectedOption}
                    onSelect={handleOptionSelect}
                    isOpen={openDropdown === 'option'}
                    onToggle={() => toggleDropdown('option')}
                    placeholder={loadingOptions ? 'Loading specs...' : 'Select Trim / Spec'}
                    disabled={saving || !selectedModel || loadingOptions}
                />
            </div>

            {loadingVehicleDetails && (
                <div className="p-2 text-center text-[10px] text-blue-400 font-mono animate-pulse bg-blue-950/20 rounded border border-blue-900/30">
                    FETCHING TELEMETRY SPECS FROM FUELECONOMY.GOV DATA MATRIX...
                </div>
            )}
        </div>
    );
}