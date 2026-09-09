// src/app/utils/electricityCalculator.js

import { ELECTRICITY_GRID_FACTORS } from '@/app/config/emissionFactors';

/**
 * Core Scope 2 Grid and Scope 1 Standby Backup Power Generation Emissions Engine
 */
export function calculateElectricityEmissions(kwh, countryCode, powerSource = 'utility_grid') {
    const kwhVal = parseFloat(kwh);
    if (isNaN(kwhVal) || kwhVal < 0) {
        throw new Error('Invalid electricity energy consumption input values.');
    }

    const rawSource = (powerSource || 'utility_grid').toLowerCase();
    const region = countryCode?.toUpperCase() || 'ZA';

    let factor = 0;
    let calculationMethodString = 'REGIONAL_UTILITY_GRID_LOOKUP';
    let finalPowerSource = 'utility_grid';

    // High-reliability wildcard check intercepts string variations from front-end select tags
    if (rawSource.includes('diesel') || rawSource.includes('generator')) {
        factor = 0.270; // Carbon intensity footprint per generated kWh via commercial standby units
        calculationMethodString = 'SCOPE_1_BACKUP_GENERATOR_COMBUSTION';
        finalPowerSource = 'diesel_generator';
    } else if (rawSource.includes('solar') || rawSource.includes('pv') || rawSource.includes('clean')) {
        factor = 0.000; // Zero-emissions clean renewable offset tier
        calculationMethodString = 'RENEWABLE_SOLAR_ZERO_EMISSION';
        finalPowerSource = 'solar_pv';
    } else {
        // Falls back cleanly to your exact emissionFactors.js global matrix configurations
        factor = ELECTRICITY_GRID_FACTORS[region] || ELECTRICITY_GRID_FACTORS.GLOBAL_AVERAGE;
    }

    const carbonKg = parseFloat((kwhVal * factor).toFixed(3));

    return {
        carbonKg,
        metadata: {
            inputKwh: kwhVal,
            countryTarget: region,
            powerSourceApplied: finalPowerSource,
            gridFactorApplied: factor,
            calculationMethod: calculationMethodString,
            timestamp: new Date().toISOString()
        }
    };
}
