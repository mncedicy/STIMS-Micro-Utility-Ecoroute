// src\app\components\fleet\asset\FleetAssetSelectorCascade.jsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SearchableDropdownField from '../../shared/SearchableDropdownField';
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
    const [searchLoading, setSearchLoading] = useState(false);

    // Track previous lookup criteria parameters to prevent query execution loops
    const lastMakeQuery = useRef('');
    const lastModelQuery = useRef('');

    // --- PIPELINE 1: Load ALL historical unique years using the optimized database RPC function ---
    useEffect(() => {
        async function fetchDistinctYears() {
            try {
                const { data, error } = await supabase
                    .rpc('get_distinct_vehicle_years');

                if (error) throw error;

                const formattedYears = data.map(d => d.year_log.toString());
                setYears(formattedYears);
            } catch (err) {
                console.error('Database RPC years fetching exception occurred:', err);
            }
        }
        fetchDistinctYears();
    }, []);

    // --- PIPELINE 2: Live Search Unique Manufacturer Brands Natively via Database Streams ---
    const fetchMakesFromDatabase = async (inputQuery = '') => {
        if (!selectedYear) return;
        setSearchLoading(true);
        const cleanQuery = inputQuery.trim();
        lastMakeQuery.current = cleanQuery;

        try {
            let baseQuery = supabase
                .from('ecoroute_static_vehicles')
                .select('make')
                .eq('year', parseInt(selectedYear, 10))
                .order('make', { ascending: true })
                .limit(100);

            if (cleanQuery.length > 0) {
                baseQuery = baseQuery.ilike('make', `%${cleanQuery}%`);
            }

            const { data, error } = await baseQuery;
            if (error) throw error;

            const uniqueMakes = [...new Set(data.map(d => d.make))];
            setMakes(uniqueMakes);
        } catch (err) {
            console.error('Database server-side make search exception:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    // --- PIPELINE 3: Live Search Engine Classification Models Based on Year + Make + Input Text ---
    const fetchModelsFromDatabase = async (inputQuery = '') => {
        if (!selectedMake || !selectedYear) return;
        setSearchLoading(true);
        const cleanQuery = inputQuery.trim();
        lastModelQuery.current = cleanQuery;

        try {
            let baseQuery = supabase
                .from('ecoroute_static_vehicles')
                .select('id, model, fuel_type_1')
                .eq('year', parseInt(selectedYear, 10))
                .eq('make', selectedMake)
                .order('model', { ascending: true })
                .limit(100);

            if (cleanQuery.length > 0) {
                baseQuery = baseQuery.ilike('model', `%${cleanQuery}%`);
            }

            const { data, error } = await baseQuery;
            if (error) throw error;

            setModels(data);
        } catch (err) {
            console.error('Database server-side model search exception:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    // Reset downstream dependencies immediately whenever the parent anchor year drops or shifts
    useEffect(() => {
        setMakes([]); setModels([]); setSelectedMake(''); setSelectedModelId(''); setSelectedModelData(null);
        onSelectedModelChange(null);
        lastMakeQuery.current = '';
        lastModelQuery.current = '';

        if (selectedYear) {
            fetchMakesFromDatabase('');
        }
    }, [selectedYear]);

    // Reset child options when manufacturer brand switches
    useEffect(() => {
        setModels([]); setSelectedModelId(''); setSelectedModelData(null);
        onSelectedModelChange(null);
        lastModelQuery.current = '';

        if (selectedMake && selectedYear) {
            fetchModelsFromDatabase('');
        }
    }, [selectedMake]);

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
            } catch (err) {
                console.error(err);
            }
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
                placeholder={searchLoading ? "Streaming database records..." : "-- SEARCH MANUFACTURER --"}
                valueDisplay={selectedMake ? selectedMake.toUpperCase() : ''}
                searchPlaceholder="Type to query matching makes from database..."
                items={makes}
                disabled={!selectedYear || saving}
                isOpen={openDropdown === 'make'}
                onToggle={() => setOpenDropdown(openDropdown === 'make' ? '' : 'make')}
                onSelect={(make) => setSelectedMake(make)}
                renderItem={(make) => make.toString().toUpperCase()} // FIXED: Returns clean string format parameter primitive instead of layout block object
                onSearchChange={(q) => fetchMakesFromDatabase(q)}
                loading={searchLoading}
            />

            {/* Field 4 of 4: Searchable Engine Class Variant Selection */}
            <SearchableDropdownField
                label="SPECIFIC ENGINE CLASSIFICATION MODEL"
                placeholder={searchLoading ? "Streaming database records..." : "-- SELECT FUEL SPECIFIC VARIANT LAYER --"}
                valueDisplay={activeModelName ? `${activeModelName} (${activeModelFuelType})` : ''}
                searchPlaceholder="Type model name attributes to query database..."
                items={models}
                disabled={!selectedMake || saving}
                isOpen={openDropdown === 'model'}
                onToggle={() => setOpenDropdown(openDropdown === 'model' ? '' : 'model')}
                onSelect={(modelObj) => setSelectedModelId(modelObj.id.toString())}
                renderItem={(modelObj) => `${modelObj.model} (${modelObj.fuel_type_1})`} // FIXED: Returns native text string template layout avoiding Element type object crash
                onSearchChange={(q) => fetchModelsFromDatabase(q)}
                loading={searchLoading}
            />

            {/* Technical HUD Spec Display card row spans full layout width underneath the grid columns */}
            <div className="col-span-1 sm:col-span-2 pt-3">
                <FleetAssetTechnicalHud selectedModelData={selectedModelData} />
            </div>
        </>
    );
}
