// src/app/utils/gasCalculator.js

import { GAS_EMISSION_FACTORS } from '@/app/config/emissionFactors';

/**
 * Core Stationary Combustion Gas Fuel Emissions Calculation Engine
 */
export function calculateGasEmissions(quantity, gasType, gasUnit) {
    const rawQuantity = parseFloat(quantity);
    if (isNaN(rawQuantity) || rawQuantity < 0) {
        throw new Error('Invalid gas quantity combustion fuel input values.');
    }

    const cleanType = (gasType || 'NATURAL_GAS').toUpperCase();
    const cleanUnit = (gasUnit || 'm3').toLowerCase();

    // Structural recovery lookup mapping to matching configuration objects
    const factor = GAS_EMISSION_FACTORS[cleanType]?.[cleanUnit] || 0;
    const carbonKg = parseFloat((rawQuantity * factor).toFixed(3));

    return {
        carbonKg,
        metadata: {
            inputQuantity: rawQuantity,
            gasClassification: cleanType,
            gasUnitApplied: cleanUnit,
            combustionFactorApplied: factor,
            timestamp: new Date().toISOString()
        }
    };
}
