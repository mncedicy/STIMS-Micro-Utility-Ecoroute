// /src/app/utils/massFormatter.js

const MASS_CONVERSIONS = {
    KG_TO_G: 1000,
    KG_TO_MT: 0.001,
    KG_TO_LB: 2.20462
};

/**
 * Converts a raw carbon calculation in kilograms into a standardized mass object.
 * Truncates floating-point errors to match database field constraints.
 * 
 * @param {number} rawCarbonKg - The calculated carbon mass in kilograms.
 * @returns {Object} Standardized mass conversion fields for ecoroute_emissions_logs.
 */
export function formatEmissionPayload(rawCarbonKg) {
    // Ensure the value is a positive number to prevent database formatting errors
    const carbonKg = Math.max(0, parseFloat(rawCarbonKg) || 0);

    return {
        carbon_kg: parseFloat(carbonKg.toFixed(3)),
        carbon_g: parseFloat((carbonKg * MASS_CONVERSIONS.KG_TO_G).toFixed(2)),
        carbon_mt: parseFloat((carbonKg * MASS_CONVERSIONS.KG_TO_MT).toFixed(5)),
        carbon_lb: parseFloat((carbonKg * MASS_CONVERSIONS.KG_TO_LB).toFixed(2))
    };
}
