// src/app/utils/shippingCalculator.js

/**
 * Granular, industry-standard logistics emission factors (kg CO2 per Tonne-Kilometer)
 */
const SHIPPING_MODE_FACTORS = {
    ocean: 0.012,      // Ultra-efficient deep sea container tracking
    rail: 0.025,       // Transnet rail network baseline configuration
    road_heavy: 0.165, // Heavy commercial logistics linehaul truck (South African standard average)
    road_light: 0.280, // Last-mile urban distribution delivery van
    standard: 0.120    // Standard baseline parameter mapping
};

/**
 * Core Shipping Logistics Emissions Calculation Engine
 */
export function calculateShippingEmissions(weight, distance, massUnit, distanceUnit, shippingMode = 'standard') {
    const weightVal = parseFloat(weight);
    const distanceVal = parseFloat(distance);

    if (isNaN(weightVal) || weightVal <= 0 || isNaN(distanceVal) || distanceVal <= 0) {
        throw new Error('Invalid cargo weight or distance tracking parameters provided.');
    }

    // 1. Convert weights cleanly to Tonnes
    let tonnes = 0;
    const cleanMassUnit = massUnit?.toLowerCase();

    if (cleanMassUnit === 'lbs') {
        tonnes = weightVal * 0.000453592;
    } else if (cleanMassUnit === 'kg') {
        tonnes = weightVal / 1000;
    } else {
        tonnes = weightVal; // Already in tonnes
    }

    // 2. Convert distance metrics to Kilometers
    const km = distanceUnit?.toLowerCase() === 'miles' ? distanceVal * 1.60934 : distanceVal;

    // 3. Resolve environmental factors
    const selectedMode = (shippingMode || 'standard').toLowerCase();
    const activeFactor = SHIPPING_MODE_FACTORS[selectedMode] || SHIPPING_MODE_FACTORS.standard;

    // 4. Compute mass matrix parameters
    const carbonKg = parseFloat((tonnes * km * activeFactor).toFixed(3));
    const tonneKilometers = parseFloat((tonnes * km).toFixed(2));

    return {
        carbonKg,
        metadata: {
            shipping_mode: selectedMode,
            shippingModeApplied: selectedMode,
            emissionsFactorPerTonneKm: activeFactor,
            tonneKilometers,
            inputWeight: weightVal,
            inputWeightUnit: massUnit || 'kg',
            inputDistance: distanceVal,
            inputDistanceUnit: distanceUnit || 'km'
        }
    };
}
