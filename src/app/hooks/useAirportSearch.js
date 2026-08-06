// /src/app/hooks/useAirportSearch.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function useAirportSearch(activeTab) {
    const [originAirportsList, setOriginAirportsList] = useState([]);
    const [destAirportsList, setDestAirportsList] = useState([]);
    const [originSearchPage, setOriginSearchPage] = useState(0);
    const [destSearchPage, setDestSearchPage] = useState(0);
    const [searchLoading, setSearchLoading] = useState(false);

    const lastOriginQuery = useRef('');
    const lastDestQuery = useRef('');

    const fetchAirportsFromDatabase = async (inputQuery = '', pageOverride = 0, type = 'origin') => {
        setSearchLoading(true);
        const ITEMS_PER_PAGE = 50;
        const cleanQuery = inputQuery.trim();

        let isNewSearchQuery = false;

        if (type === 'origin') {
            if (cleanQuery !== lastOriginQuery.current) {
                isNewSearchQuery = true;
                lastOriginQuery.current = cleanQuery;
            }
        } else {
            if (cleanQuery !== lastDestQuery.current) {
                isNewSearchQuery = true;
                lastDestQuery.current = cleanQuery;
            }
        }

        let targetPage = isNewSearchQuery ? 0 : (pageOverride === -1 ? (type === 'origin' ? originSearchPage + 1 : destSearchPage + 1) : pageOverride);
        const fromRange = targetPage * ITEMS_PER_PAGE;
        const toRange = fromRange + ITEMS_PER_PAGE - 1;

        try {
            let baseQuery = supabase
                .from('ecoroute_static_airports')
                .select('id, name, iso_country, municipality, latitude, longitude')
                .order('name', { ascending: true })
                .range(fromRange, toRange);

            if (cleanQuery.length > 0) {
                const formattedQuery = cleanQuery.split(/\s+/).join(' & ');
                baseQuery = baseQuery.textSearch('search_vector', formattedQuery, {
                    config: 'english',
                    type: 'phrase'
                });
            }

            const { data, error } = await baseQuery;
            if (error) throw error;

            if (data) {
                if (type === 'origin') {
                    setOriginAirportsList(prev => targetPage === 0 ? data : [...prev, ...data]);
                    setOriginSearchPage(targetPage);
                } else {
                    setDestAirportsList(prev => targetPage === 0 ? data : [...prev, ...data]);
                    setDestSearchPage(targetPage);
                }
            }
        } catch (err) {
            console.error(`[Live ${type} Airport Search Exception]:`, err);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'flight') {
            lastOriginQuery.current = '';
            lastDestQuery.current = '';
            fetchAirportsFromDatabase('', 0, 'origin');
            fetchAirportsFromDatabase('', 0, 'dest');
        }
    }, [activeTab]);

    return {
        originAirportsList,
        destAirportsList,
        searchLoading,
        fetchAirportsFromDatabase
    };
}
