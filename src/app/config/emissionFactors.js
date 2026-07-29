// /src/app/config/emissionFactors.js

/**
 * Global Scope 2 Grid Emission Factors (GEFs).
 * Unit: kg CO2e per kWh (kilograms of CO2 equivalent per kilowatt-hour)
 * Data Sources: IEA, Ember Climate Review, US EPA eGRID, UK DEFRA.
 */
export const ELECTRICITY_GRID_FACTORS = {
    // === AFRICA ===
    ZA: 0.942, // South Africa (Coal-dominated Eskom grid)
    BW: 0.785, // Botswana (Coal generation and regional imports)
    EG: 0.400, // Egypt (Natural gas reliance)
    NG: 0.350, // Nigeria (Gas-fired power blocks & hydro mix)
    MA: 0.510, // Morocco (Mixed coal, natural gas, and expanding solar)
    KE: 0.070, // Kenya (Highly green geothermal and hydroelectric mix)
    ET: 0.010, // Ethiopia (Near-zero output via major hydro installations)
    ZM: 0.018, // Zambia (Hydro-dominated infrastructure)
    CD: 0.005, // DR Congo (Massive Inga run-of-river hydro generation)

    // === NORTH AMERICA ===
    US: 0.350, // United States (EPA eGRID national fuel-mix average)
    CA: 0.119, // Canada (Clean baseline due to massive provincial hydropower)
    MX: 0.410, // Mexico (Gas and heavy fuel oil thermal generation)

    // === EUROPE (High nuclear and renewable penetration) ===
    GB: 0.177, // United Kingdom (UK DESNZ / DEFRA official reporting standard)
    DE: 0.330, // Germany (Mixed coal, gas, wind, and solar assets)
    FR: 0.041, // France (Highly decarbonised nuclear generation grid)
    IT: 0.260, // Italy (Natural gas and renewables mix)
    ES: 0.150, // Spain (Strong wind and solar output capacity)
    NO: 0.028, // Norway (Ultra-clean grid fed by ~99% domestic hydro)
    PL: 0.650, // Poland (High coal reliance, similar to South Africa)

    // === ASIA & PACIFIC ===
    CN: 0.526, // China (Rapidly expanding solar/wind balancing remaining coal)
    IN: 0.670, // India (Coal-heavy infrastructure, improving annual intensity)
    JP: 0.477, // Japan (Mixed gas, coal, and recovering nuclear capacity)
    AU: 0.525, // Australia (Coal-heavy state baselines transitioning to solar)
    SG: 0.497, // Singapore (Almost entirely dependent on imported natural gas)
    ID: 0.680, // Indonesia (Heavy reliance on domestic coal assets)
    KR: 0.415, // South Korea (Industrial mix of gas, nuclear, and coal)

    // === CENTRAL & SOUTH AMERICA ===
    BR: 0.110, // Brazil (Highly sustainable power grid run on core hydro)
    AR: 0.257, // Argentina (Mixed natural gas and nuclear baselines)
    CL: 0.221, // Chile (Strong combination of hydro and solar generation)
    CO: 0.210, // Colombia (Hydropower dependency)

    // === MIDDLE EAST ===
    SA: 0.530, // Saudi Arabia (Oil and heavy natural gas infrastructure)
    AE: 0.410, // United Arab Emirates (Gas thermal transitioning with nuclear)

    // === SYSTEM SYSTEM FALLBACK CONSTANTS ===
    GLOBAL_AVERAGE: 0.435, // Global fallback baseline metric per kWh
    AFRICA_AVERAGE: 0.520  // Regional fallback metric for unmapped African countries
};

/**
 * Universal Scope 1 Direct Gas Fuel Combustion Constants.
 * Unit: kg CO2e per input dimension unit
 * Chemical attributes remain uniform globally.
 */
export const GAS_EMISSION_FACTORS = {
    NATURAL_GAS: {
        m3: 2.02,     // kg CO2e per cubic meter consumed
        kwh: 0.183    // kg CO2e per equivalent kilowatt-hour metric
    },
    LPG: {
        liter: 1.56,  // kg CO2e per liter of liquefied petroleum gas
        kg: 2.94      // kg CO2e per solid mass kilogram (Cylinder Gas)
    }
};
