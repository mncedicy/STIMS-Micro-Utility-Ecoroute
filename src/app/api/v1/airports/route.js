import {
    handlePreflightOptions,
    authenticateAndValidateToken,
    sendApiResponse
} from '../config/apiConfig';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req) {
    return handlePreflightOptions(req);
}

// In-memory cache for external dataset to maximize request throughput
let cachedAirportsList = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchGlobalAirportsData() {
    const now = Date.now();
    if (cachedAirportsList && (now - lastCacheFetchTime) < CACHE_TTL_MS) {
        return cachedAirportsList;
    }

    const res = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv', {
        headers: { 'User-Agent': 'EcoRoute-System-Agent/1.0' },
        next: { revalidate: 86400 }
    });

    if (!res.ok) throw new Error(`Upstream airport data fetch failed: ${res.status}`);

    const text = await res.text();
    const lines = text.split('\n').filter(Boolean);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('name');
    const latIdx = headers.indexOf('latitude_deg');
    const lonIdx = headers.indexOf('longitude_deg');
    const contIdx = headers.indexOf('continent');
    const isoIdx = headers.indexOf('iso_country');
    const muniIdx = headers.indexOf('municipality');
    const iataIdx = headers.indexOf('iata_code');
    const icaoIdx = headers.indexOf('ident');

    const parseCsvRow = (rowStr) => {
        const matches = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        return matches.map(m => m.replace(/^"|"$/g, '').trim());
    };

    const parsedAirports = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvRow(lines[i]);
        if (cols.length < Math.max(idIdx, nameIdx, latIdx, lonIdx)) continue;

        parsedAirports.push({
            id: cols[idIdx] || `${i}`,
            name: cols[nameIdx] || 'Unknown Airport',
            latitude: parseFloat(cols[latIdx]) || 0,
            longitude: parseFloat(cols[lonIdx]) || 0,
            continent: cols[contIdx] || '',
            iso_country: cols[isoIdx] || '',
            municipality: cols[muniIdx] || '',
            iata_code: cols[iataIdx] || '',
            icao_code: cols[icaoIdx] || ''
        });
    }

    cachedAirportsList = parsedAirports;
    lastCacheFetchTime = now;
    return parsedAirports;
}

export async function GET(req) {
    const authValidation = await authenticateAndValidateToken(req, { checkQuota: false });
    if (authValidation.errorResponse) return authValidation.errorResponse;

    const { corsHeaders } = authValidation;

    try {
        const url = new URL(req.url);
        const continent = url.searchParams.get('continent');
        const isoCountry = url.searchParams.get('iso_country');
        const searchQuery = url.searchParams.get('search');

        const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
        const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);

        const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
        const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);
        const offset = (page - 1) * limit;

        const allAirports = await fetchGlobalAirportsData();

        let filtered = allAirports;

        if (continent) {
            const cleanContinent = continent.toUpperCase().trim();
            filtered = filtered.filter(a => a.continent.toUpperCase() === cleanContinent);
        }
        if (isoCountry) {
            const cleanCountry = isoCountry.toUpperCase().trim();
            filtered = filtered.filter(a => a.iso_country.toUpperCase() === cleanCountry);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.municipality.toLowerCase().includes(q) ||
                a.iata_code.toLowerCase().includes(q) ||
                a.icao_code.toLowerCase().includes(q)
            );
        }

        const totalRecords = filtered.length;
        const paginatedAirports = filtered.slice(offset, offset + limit);

        return sendApiResponse(req, {
            success: true,
            pagination: {
                total_records: totalRecords,
                current_page: page,
                per_page: limit,
                total_pages: Math.ceil(totalRecords / limit)
            },
            airports: paginatedAirports
        }, corsHeaders, 200);

    } catch (err) {
        console.error('🚨 [Airport Fetch Failure]:', err.message);
        return sendApiResponse(req, { error: 'Internal airport lookup disruption: ' + err.message }, corsHeaders, 500);
    }
}