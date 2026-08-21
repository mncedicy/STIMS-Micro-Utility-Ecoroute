// src/app/api/estimates/categoryPipeline.js

import { calculateFlightEmissions } from '@/app/utils/flightCalculator';
import { calculateVehicleEmissions } from '@/app/utils/vehicleCalculator';
import { ELECTRICITY_GRID_FACTORS, GAS_EMISSION_FACTORS } from '@/app/config/emissionFactors';

export async function processCategoryEmissions(cleanType, body, tokenFallback = '') {
    let calculatedKg = 0;
    let metadataLog = { calculatedOffline: true, timestamp: new Date().toISOString() };

    switch (cleanType) {
        case 'flight': {
            const flightResult = await calculateFlightEmissions(body.origin_iata, body.dest_iata, body.passengers);
            return { calculatedKg: flightResult.carbonKg, metadataLog: { ...metadataLog, ...flightResult.metadata } };
        }

        case 'vehicle': {
            const osrmContext = {
                totalDurationSeconds: body.osrm_total_duration || 0,
                tripLegsArray: body.osrm_legs_data || [],
                waypointsArray: body.osrm_waypoints_data || []
            };

            const vehicleResult = await calculateVehicleEmissions(
                body.vehicle_id,
                body.distance,
                body.unit,
                tokenFallback,
                osrmContext
            );

            return {
                calculatedKg: vehicleResult.carbonKg,
                metadataLog: {
                    ...metadataLog,
                    ...vehicleResult.metadata,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || []
                }
            };
        }

        case 'shipping': {
            const weightVal = parseFloat(body.cargo_weight);
            const distanceVal = parseFloat(body.distance);
            let tonnes = body.mass_unit?.toLowerCase() === 'lbs' ? weightVal * 0.000453592 : body.mass_unit?.toLowerCase() === 'kg' ? weightVal / 1000 : weightVal;
            const km = body.unit?.toLowerCase() === 'miles' ? distanceVal * 1.60934 : distanceVal;

            calculatedKg = tonnes * km * 0.12;

            return {
                calculatedKg,
                metadataLog: {
                    ...metadataLog,
                    tonneKilometers: parseFloat((tonnes * km).toFixed(2)),
                    inputWeight: weightVal,
                    inputDistance: distanceVal,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || []
                }
            };
        }

        case 'electricity': {
            const kwhVal = parseFloat(body.kwh);
            if (isNaN(kwhVal) || kwhVal < 0) throw new Error('Invalid electricity energy consumption input values.');
            const region = body.country_code?.toUpperCase() || 'ZA';
            const factor = ELECTRICITY_GRID_FACTORS[region] || ELECTRICITY_GRID_FACTORS.GLOBAL_AVERAGE;

            calculatedKg = kwhVal * factor;
            return { calculatedKg, metadataLog: { ...metadataLog, inputKwh: kwhVal, countryTarget: region, gridFactorApplied: factor } };
        }

        case 'gas': {
            const qty = parseFloat(body.quantity);
            const type = body.gas_type?.toUpperCase();
            const unit = body.gas_unit?.toLowerCase();
            const factor = GAS_EMISSION_FACTORS[type]?.[unit] || 0;

            return { calculatedKg: qty * factor, metadataLog: { ...metadataLog, inputQuantity: qty, gasClassification: type, combustionFactorApplied: factor } };
        }

        default:
            throw new Error(`Unsupported calculations request mode: ${cleanType}`);
    }
}
