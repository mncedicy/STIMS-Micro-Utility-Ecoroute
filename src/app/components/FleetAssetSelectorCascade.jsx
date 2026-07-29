// /src/app/components/FleetAssetSelectorCascade.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SearchableDropdownField from './SearchableDropdownField';
import FleetAssetTechnicalHud from './FleetAssetTechnicalHud';

export default function FleetAssetSelectorCascade({ saving, onSelectedModelChange }) {
    const [years, setYears] = useState([]);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModelId, setSelectedModelId] = useState('');
    const [selectedModelData, setSelectedModelData] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(''); // 'year', 'make', 'model', or ''

    // --- PIPELINE 1: Load ALL historical unique years using the optimized database RPC function ---
    useEffect(() => {
        async function fetchDistinctYears() {
            try {
                // Invokes the new PostgreSQL native function, bypassing default 1000 row page limit restrictions
                const { data, error } = await supabase
                    .rpc('get_distinct_vehicle_years');

                if (error) throw error;

                // Map the integer array contents cleanly over to string lookup objects
                const formattedYears = data.map(d => d.year_log.toString());
                setYears(formattedYears);
            } catch (err) {
                console.error('Database RPC years fetching exception occurred:', err);
            }
        }
        fetchDistinctYears();
    }, []);

    // --- PIPELINE 2: Load unique manufacturer brands for the selected year (Max 1000 matching items is plenty for a year) ---
    useEffect(() => {
        if (!selectedYear) {
            setMakes([]); setModels([]); setSelectedMake(''); setSelectedModelId(''); setSelectedModelData(null);
            onSelectedModelChange(null); return;
        }
        async function fetchMakes() {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_vehicles')
                    .select('make')
                    .eq('year', parseInt(selectedYear, 10))
                    .order('make', { ascending: true });
                if (error) throw error;
                setMakes([...new Set(data.map(d => d.make))]);
                setModels([]); setSelectedMake(''); setSelectedModelId(''); setSelectedModelData(null);
                onSelectedModelChange(null);
            } catch (err) { console.error(err); }
        }
        fetchMakes();
    }, [selectedYear, onSelectedModelChange]);

    // --- PIPELINE 3: Load engine models for Year + Make combination ---
    useEffect(() => {
        if (!selectedMake || !selectedYear) { setModels([]); setSelectedModelId(''); setSelectedModelData(null); onSelectedModelChange(null); return; }
        async function fetchModels() {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_vehicles')
                    .select('id, model, fuel_type_1')
                    .eq('year', parseInt(selectedYear, 10))
                    .eq('make', selectedMake)
                    .order('model', { ascending: true });
                if (error) throw error;
                setModels(data);
                setSelectedModelId(''); setSelectedModelData(null);
                onSelectedModelChange(null);
            } catch (err) { console.error(err); }
        }
        fetchModels();
    }, [selectedYear, selectedMake, onSelectedModelChange]);

    // --- PIPELINE 4: Fetch tech specifications details for selected ID ---
    useEffect(() => {
        if (!selectedModelId) { setSelectedModelData(null); onSelectedModelChange(null); return; }
        async function fetchDetails() {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_vehicles')
                    .select('*')
                    .eq('id', parseInt(selectedModelId, 10))
                    .single();
                if (error) throw error;
                setSelectedModelData(data);
                onSelectedModelChange(data);
            } catch (err) { console.error(err); }
        }
        fetchDetails();
    }, [selectedModelId, onSelectedModelChange]);

    const activeModelName = selectedModelId ? models.find(m => m.id.toString() === selectedModelId)?.model : '';
    const activeModelFuelType = selectedModelId ? models.find(m => m.id.toString() === selectedModelId)?.fuel_type_1 : '';

    return (
        <>
            {/* Field 2 of 4: Searchable Year Selection */}
            <SearchableDropdownField
                label="MANUFACTURING YEAR LOG"
                placeholder="-- SEARCH YEAR --"
                valueDisplay={selectedYear}
                searchPlaceholder="Type to filter years..."
                items={years}
                disabled={saving}
                isOpen={openDropdown === 'year'}
                onToggle={() => setOpenDropdown(openDropdown === 'year' ? '' : 'year')}
                onSelect={(year) => setSelectedYear(year)}
            />

            {/* Field 3 of 4: Searchable Manufacturer Brand Selection */}
            <SearchableDropdownField
                label="VEHICLE MANUFACTURER (MAKE)"
                placeholder="-- SEARCH MANUFACTURER --"
                valueDisplay={selectedMake}
                searchPlaceholder="Type to search brands..."
                items={makes}
                disabled={!selectedYear || saving}
                isOpen={openDropdown === 'make'}
                onToggle={() => setOpenDropdown(openDropdown === 'make' ? '' : 'make')}
                onSelect={(make) => setSelectedMake(make)}
                renderItem={(make) => <span className="uppercase">{make}</span>}
            />

            {/* Field 4 of 4: Searchable Engine Class Variant Selection */}
            <SearchableDropdownField
                label="SPECIFIC ENGINE CLASSIFICATION MODEL"
                placeholder="-- SELECT FUEL SPECIFIC VARIANT LAYER --"
                valueDisplay={activeModelName ? `${activeModelName} (${activeModelFuelType})` : ''}
                searchPlaceholder="Filter model name or fuel attributes..."
                items={models}
                disabled={!selectedMake || saving}
                isOpen={openDropdown === 'model'}
                onToggle={() => setOpenDropdown(openDropdown === 'model' ? '' : 'model')}
                onSelect={(modelObj) => setSelectedModelId(modelObj.id.toString())}
                renderItem={(modelObj) => (
                    <>
                        {modelObj.model} <span className="text-[10px] text-blue-500 font-bold ml-1">({modelObj.fuel_type_1})</span>
                    </>
                )}
            />

            {/* Technical HUD Spec Display card row spans full layout width underneath the grid columns */}
            <div className="col-span-1 sm:col-span-2 pt-3">
                <FleetAssetTechnicalHud selectedModelData={selectedModelData} />
            </div>
        </>
    );
}
