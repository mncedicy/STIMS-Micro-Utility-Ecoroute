// src/app/hooks/useAirportSearch.js

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// In-memory cache across tab switches
let cachedAirports = null;
let isFetching = false;

export default function useAirportSearch(activeTab) {
    const [originAirportsList, setOriginAirportsList] = useState([]);
    const [destAirportsList, setDestAirportsList] = useState([]);
    const [originSearchPage, setOriginSearchPage] = useState(0);
    const [destSearchPage, setDestSearchPage] = useState(0);
    const [searchLoading, setSearchLoading] = useState(false);

    const lastOriginQuery = useRef('');
    const lastDestQuery = useRef('');
    const debounceTimer = useRef(null);

    // Fetch and parse the CSV dataset into memory
    const loadDataset = async () => {
        if (cachedAirports) return cachedAirports;
        if (isFetching) {
            // Wait if an existing fetch is in progress
            while (isFetching) {
                await new Promise((res) => setTimeout(res, 100));
            }
            return cachedAirports || [];
        }

        isFetching = true;
        try {
            const res = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv');
            const text = await res.text();

            const lines = text.split('\n');
            const parsed = [];

            // Process CSV lines safely
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Split CSV line respecting quoted values
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cols.length < 11) continue;

                const type = cols[2]?.replace(/"/g, '') || '';
                // Filter out closed or non-standard landing spots for better relevance
                if (type === 'closed') continue;

                const name = cols[3]?.replace(/"/g, '') || '';
                const iata = cols[13]?.replace(/"/g, '') || '';

                parsed.push({
                    id: cols[0]?.replace(/"/g, '') || String(i),
                    name,
                    latitude: parseFloat(cols[4]?.replace(/"/g, '')) || 0,
                    longitude: parseFloat(cols[5]?.replace(/"/g, '')) || 0,
                    continent: cols[7]?.replace(/"/g, '') || '',
                    iso_country: cols[8]?.replace(/"/g, '') || '',
                    municipality: cols[10]?.replace(/"/g, '') || 'N/A',
                    iata: iata
                });
            }

            cachedAirports = parsed;
            return parsed;
        } catch (err) {
            console.error('[Airport CSV Load Exception]:', err);
            return [];
        } finally {
            isFetching = false;
        }
    };

    const fetchAirportsFromDatabase = useCallback((inputQuery = '', pageOverride = 0, type = 'origin') => {
        if (activeTab !== 'flight') return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setSearchLoading(true);
            const ITEMS_PER_PAGE = 30;
            const cleanQuery = inputQuery.trim().toLowerCase();

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

            const dataset = await loadDataset();
            const currentSearchPage = type === 'origin' ? originSearchPage : destSearchPage;
            let targetPage = isNewSearchQuery ? 0 : (pageOverride === -1 ? currentSearchPage + 1 : pageOverride);

            // Filter raw data locally
            let filtered = dataset;
            if (cleanQuery.length > 0) {
                filtered = dataset.filter((ap) => {
                    return (
                        ap.name.toLowerCase().includes(cleanQuery) ||
                        ap.municipality.toLowerCase().includes(cleanQuery) ||
                        ap.iso_country.toLowerCase() === cleanQuery ||
                        (ap.iata && ap.iata.toLowerCase() === cleanQuery)
                    );
                });
            }

            const fromRange = targetPage * ITEMS_PER_PAGE;
            const pageData = filtered.slice(fromRange, fromRange + ITEMS_PER_PAGE);

            if (type === 'origin') {
                setOriginAirportsList((prev) => (targetPage === 0 ? pageData : [...prev, ...pageData]));
                setOriginSearchPage(targetPage);
            } else {
                setDestAirportsList((prev) => (targetPage === 0 ? pageData : [...prev, ...pageData]));
                setDestSearchPage(targetPage);
            }

            setSearchLoading(false);
        }, 200);
    }, [activeTab, originSearchPage, destSearchPage]);

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