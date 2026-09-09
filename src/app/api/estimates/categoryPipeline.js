// src/app/api/estimates/categoryPipeline.js

import { calculateFlightEmissions } from '@/app/utils/flightCalculator';
import { calculateVehicleEmissions } from '@/app/utils/vehicleCalculator';
import { calculateShippingEmissions } from '@/app/utils/shippingCalculator';
import { calculateGasEmissions } from '@/app/utils/gasCalculator';
import { calculateElectricityEmissions } from '@/app/utils/electricityCalculator'; // Newly extracted calculation utility module

export async function processCategoryEmissions(cleanType, body, tokenFallback = '') {
    let calculatedKg = 0;
    let metadataLog = { calculatedOffline: true, timestamp: new Date().toISOString() };

    switch (cleanType) {
        case 'flight': {
            const flightResult = await calculateFlightEmissions(
                body.origin_iata,
                body.dest_iata,
                body.passengers,
                body.flight_class
            );
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
            const shippingResult = calculateShippingEmissions(
                body.cargo_weight,
                body.distance,
                body.mass_unit,
                body.unit,
                body.shipping_mode
            );

            return {
                calculatedKg: shippingResult.carbonKg,
                metadataLog: {
                    ...metadataLog,
                    ...shippingResult.metadata,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || []
                }
            };
        }

        case 'electricity': {
            // Business logic decoupled and handed off to individual calculations utility layers
            const electricityResult = calculateElectricityEmissions(
                body.kwh,
                body.country_code,
                body.power_source
            );

            return {
                calculatedKg: electricityResult.carbonKg,
                metadataLog: {
                    ...metadataLog,
                    ...electricityResult.metadata,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || []
                }
            };
        }

        case 'gas': {
            const gasResult = calculateGasEmissions(
                body.quantity,
                body.gas_type,
                body.gas_unit
            );

            return {
                calculatedKg: gasResult.carbonKg,
                metadataLog: {
                    ...metadataLog,
                    ...gasResult.metadata,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || []
                }
            };
        }

        default:
            throw new Error(`Unsupported calculations request mode: ${cleanType}`);
    }
}
