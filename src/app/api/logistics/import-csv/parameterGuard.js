// /src/app/api/logistics/import-csv/parameterGuard.js

/**
 * Resolves messy string inputs down to strict 2-character ISO country tokens.
 * Mapped to support all countries in the global grid factors configuration table.
 */
export function sanitizeCountryCode(rowCountryValue) {
    if (!rowCountryValue) return 'ZA'; // Default system fallback core anchor

    const rawCountryInput = rowCountryValue.toString().trim().toUpperCase().replace(/["']/g, '');

    // 1. Direct validation pass if user provided an accurate 2-character country code
    if (rawCountryInput.length === 2) {
        return rawCountryInput;
    }

    // 2. Comprehensive Multi-Region ISO Dictionary Mapping Matrix Lookups
    switch (rawCountryInput) {
        // === AFRICA ===
        case 'SOUTH AFRICA': case 'RSA': case 'ZAR': case 'AZ': return 'ZA';
        case 'BOTSWANA': case 'BWA': case 'BWP': return 'BW';
        case 'EGYPT': case 'EGY': case 'EGP': return 'EG';
        case 'NIGERIA': case 'NGA': case 'NGN': return 'NG';
        case 'MOROCCO': case 'MAR': case 'MAD': return 'MA';
        case 'KENYA': case 'KEN': case 'KES': return 'KE';
        case 'ETHIOPIA': case 'ETH': case 'ETB': return 'ET';
        case 'ZAMBIA': case 'ZMB': case 'ZMW': return 'ZM';
        case 'DR CONGO': case 'CONGO': case 'COD': case 'CDF': return 'CD';

        // === NORTH AMERICA ===
        case 'UNITED STATES': case 'UNITED STATES OF AMERICA': case 'USA': case 'USD': return 'US';
        case 'CANADA': case 'CAN': case 'CAD': return 'CA';
        case 'MEXICO': case 'MEX': case 'MXN': return 'MX';

        // === EUROPE ===
        case 'UNITED KINGDOM': case 'GREAT BRITAIN': case 'UK': case 'GBR': case 'GBP': return 'GB';
        case 'GERMANY': case 'DEU': case 'EUR': return 'DE';
        case 'FRANCE': case 'FRA': return 'FR';
        case 'ITALY': case 'ITA': return 'IT';
        case 'SPAIN': case 'ESP': return 'ES';
        case 'NORWAY': case 'NOR': case 'NOK': return 'NO';
        case 'POLAND': case 'POL': case 'PLN': return 'PL';

        // === ASIA & PACIFIC ===
        case 'CHINA': case 'CHN': case 'CNY': return 'CN';
        case 'INDIA': case 'IND': case 'INR': return 'IN';
        case 'JAPAN': case 'JPN': case 'JPY': return 'JP';
        case 'AUSTRALIA': case 'AUS': case 'AUD': return 'AU';
        case 'SINGAPORE': case 'SGP': case 'SGD': return 'SG';
        case 'INDONESIA': case 'IDN': case 'IDR': return 'ID';
        case 'SOUTH KOREA': case 'KOREA': case 'KOR': case 'KRW': return 'KR';

        // === CENTRAL & SOUTH AMERICA ===
        case 'BRAZIL': case 'BRA': case 'BRL': return 'BR';
        case 'ARGENTINA': case 'ARG': case 'ARS': return 'AR';
        case 'CHILE': case 'CHL': case 'CLP': return 'CL';
        case 'COLOMBIA': case 'COL': case 'COP': return 'CO';

        // === MIDDLE EAST ===
        case 'SAUDI ARABIA': case 'SAUDI': case 'SAU': case 'SAR': return 'SA';
        case 'UNITED ARAB EMIRATES': case 'UAE': case 'ARE': case 'AED': return 'AE';

        default:
            // Fallback boundary truncate guard slice prevents policy length violations
            if (rawCountryInput.length > 2) {
                return rawCountryInput.substring(0, 2);
            }
            return 'ZA';
    }
}
