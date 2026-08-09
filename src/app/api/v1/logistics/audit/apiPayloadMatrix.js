// /src/app/api/v1/logistics/audit/apiPayloadMatrix.js

/**
 * Validates input parameters across all 5 category sub-forms.
 */
export function sanitizeCategoryPayload(cleanType, body, normalizedPayload) {
    if (cleanType === 'vehicle') {
        if (!body.vehicle_id || typeof body.vehicle_id !== 'string') {
            return 'Validation Error: Land vehicle operations tracking requires a valid "vehicle_id" string hash link.';
        }
        const dist = parseFloat(body.distance);
        if (isNaN(dist) || dist <= 0 || !isFinite(dist)) {
            return 'Validation Error: Field "distance" must resolve to a positive numeric execution value greater than zero.';
        }
        const unit = body.unit ? body.unit.trim().toLowerCase() : 'km';
        if (!['km', 'miles'].includes(unit)) {
            return 'Validation Error: Field "unit" bounds error. Allowed attributes: ["km", "miles"].';
        }
        normalizedPayload.unit = unit;
        normalizedPayload.distance = dist;
    }

    else if (cleanType === 'flight') {
        const origin = body.origin_identifier || body.origin_iata;
        const dest = body.dest_identifier || body.dest_iata;

        if (!origin || typeof origin !== 'string' || !dest || typeof dest !== 'string') {
            return 'Validation Error: Flight sector path logging requires "origin_identifier" and "dest_identifier" string lookup ID keys.';
        }
        if (origin.trim() === dest.trim()) {
            return 'Validation Error: Terminal Collision Guard blocked request. Origin airport location coordinates cannot match the destination terminal.';
        }
        const paxCount = parseInt(body.passengers || body.passengers_count, 10) || 1;
        if (isNaN(paxCount) || paxCount <= 0 || paxCount > 850) {
            return 'Validation Error: Parameter "passengers" capacity out of bounds. Must map to an integer between 1 and 850.';
        }
        normalizedPayload.origin_iata = origin.trim();
        normalizedPayload.dest_iata = dest.trim();
        normalizedPayload.passengers = paxCount;
    }

    else if (cleanType === 'shipping') {
        const dist = parseFloat(body.distance);
        const weight = parseFloat(body.cargo_weight);

        if (isNaN(dist) || dist <= 0 || !isFinite(dist)) {
            return 'Validation Error: Cargo transit calculations require a valid positive "distance" metric run.';
        }
        if (isNaN(weight) || weight <= 0 || !isFinite(weight)) {
            return 'Validation Error: Property parameter "cargo_weight" must resolve to a positive non-zero numeric metric mass.';
        }
        const distUnit = body.unit ? body.unit.trim().toLowerCase() : 'km';
        if (!['km', 'miles'].includes(distUnit)) {
            return 'Validation Error: Field "unit" layout boundary error. Accepted dimensions: ["km", "miles"].';
        }
        const massUnit = body.mass_unit ? body.mass_unit.trim().toLowerCase() : 'kg';
        if (!['kg', 'lbs', 'tonnes'].includes(massUnit)) {
            return 'Validation Error: Field "mass_unit" data definition bounds exception. Supported strings: ["kg", "lbs", "tonnes"].';
        }
        normalizedPayload.distance = dist;
        normalizedPayload.cargo_weight = weight;
        normalizedPayload.unit = distUnit;
        normalizedPayload.mass_unit = massUnit;
    }

    else if (cleanType === 'electricity') {
        const kwhNum = parseFloat(body.energy_kwh || body.kwh);
        if (isNaN(kwhNum) || kwhNum <= 0 || !isFinite(kwhNum)) {
            return 'Validation Error: Utility grid evaluation requires a positive non-zero "energy_kwh" power load consumption input.';
        }
        const country = body.country_code ? body.country_code.trim().toUpperCase() : 'ZA';
        if (country.length !== 2) {
            return 'Validation Error: Parameter "country_code" field must conform strictly to a standard 2-character country format string (e.g. ZA, US).';
        }
        normalizedPayload.kwh = kwhNum;
        normalizedPayload.country_code = country;
    }

    else if (cleanType === 'gas') {
        const quantityNum = parseFloat(body.gas_quantity || body.quantity);
        if (isNaN(quantityNum) || quantityNum <= 0 || !isFinite(quantityNum)) {
            return 'Validation Error: Fuel combustion log matrix parameters require a positive non-zero "gas_quantity" quantity input value.';
        }
        const typeLabel = body.gas_type ? body.gas_type.trim().toUpperCase() : 'NATURAL_GAS';
        if (!['NATURAL_GAS', 'LPG'].includes(typeLabel)) {
            return 'Validation Error: Field "gas_type" values out of bounds. Supported system options: ["NATURAL_GAS", "LPG"].';
        }
        const unitLabel = body.gas_unit ? body.gas_unit.trim().toLowerCase() : 'm3';
        if (!['m3', 'kwh', 'liter', 'kg'].includes(unitLabel)) {
            return 'Validation Error: Property string "gas_unit" contains an unmapped attribute indicator.';
        }
        if (typeLabel === 'NATURAL_GAS' && !['m3', 'kwh'].includes(unitLabel)) {
            return 'Validation Error: Structural attribute clash. Natural Gas volume pipelines can only evaluate using units ["m3", "kwh"].';
        }
        if (typeLabel === 'LPG' && !['liter', 'kg'].includes(unitLabel)) {
            return 'Validation Error: Structural attribute clash. Liquefied Petroleum Cylinder Gas (LPG) can only evaluate using mass options ["liter", "kg"].';
        }
        normalizedPayload.quantity = quantityNum;
        normalizedPayload.gas_type = typeLabel;
        normalizedPayload.gas_unit = unitLabel;
    }
    return null; // Passes all validation criteria smoothly
}
