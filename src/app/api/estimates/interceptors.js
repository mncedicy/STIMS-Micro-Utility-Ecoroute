// src/app/api/estimates/interceptors.js
import { NextResponse } from 'next/server';
import { calculate } from '../../utils/dispatch/routeHelpers';
import { calculateTax } from '../../utils/dispatch/taxHelpers';
import { supabaseAdmin } from '../../lib/supabaseAdminServer'; // Fixed: Converted to relative import path shortcut

export async function handleSpecialCategoryCalculations({ cleanType, body, userId }) {
    if (cleanType === 'route') {
        const routeResult = await calculate(userId, body.vehicle_id, body.coordinates_string);
        if (routeResult.error) {
            return {
                intercepted: true,
                response: NextResponse.json({ error: routeResult.error }, { status: routeResult.status || 400 })
            };
        }

        const activePayload = routeResult.responsePayload?.route_projection || {};
        const specs = routeResult.responsePayload?.vehicle_specs || {};
        const resolvedDistance = routeResult.actualDistanceKm || activePayload.actual_distance_km || 0;

        const structuredRouteLog = {
            id: 'route_matrix_direct',
            category_display: 'ROUTE CHECKER',
            carbon_kg: routeResult.actualCarbonKg || activePayload.projected_carbon_kg || 0,
            carbon_mt: parseFloat(((routeResult.actualCarbonKg || 0) / 1000).toFixed(4)),
            carbon_lb: parseFloat(((routeResult.actualCarbonKg || 0) * 2.20462).toFixed(2)),
            carbon_g: parseFloat(((routeResult.actualCarbonKg || 0) * 1000).toFixed(2)),
            input_distance: resolvedDistance,
            input_unit: 'km',
            raw_payload: {
                metadata: {
                    sequencePoints: body.coordinates_string.length,
                    routing_engine: activePayload.routing_engine || 'Haversine Matrix snapped via OSRM Engine',
                    projectedFuelLitres: activePayload.projected_fuel_litres || 0,
                    vehicleDescription: specs.description || 'Honda Accord (2010)',
                    carbonMultiplierApplied: specs.carbon_multiplier || 0.220886,
                    coordinatesArray: body.coordinates_string,
                    totalDurationSeconds: body.osrm_total_duration || 0,
                    tripLegsArray: body.osrm_legs_data || [],
                    waypointsArray: body.osrm_waypoints_data || [],
                    osrm_total_duration: body.osrm_total_duration || 0,
                    osrm_legs_data: body.osrm_legs_data || [],
                    osrm_waypoints_data: body.osrm_waypoints_data || []
                }
            }
        };
        return { intercepted: true, response: NextResponse.json({ success: true, data: structuredRouteLog }, { status: 200 }) };
    }

    if (cleanType === 'tax') {
        const cleanStartDate = body.start_date ? body.start_date.toString().substring(0, 10) : null;
        const cleanEndDate = body.end_date ? body.end_date.toString().substring(0, 10) : null;

        const taxResult = await calculateTax(userId, cleanStartDate, cleanEndDate, supabaseAdmin);
        if (taxResult.error) {
            return {
                intercepted: true,
                response: NextResponse.json({ error: taxResult.error }, { status: taxResult.status || 400 })
            };
        }

        const activeLedger = taxResult.responsePayload?.sars_tax_compliance_ledger || {};
        const summaryMetrics = taxResult.responsePayload?.summary_metrics || {};

        const structuredTaxLog = {
            id: 'tax_ledger_direct',
            category_display: 'CARBON TAX REPORT',
            carbon_kg: summaryMetrics.total_emissions_co2_kg || 0,
            carbon_mt: summaryMetrics.total_emissions_co2_mt || 0,
            carbon_lb: parseFloat(((summaryMetrics.total_emissions_co2_kg || 0) * 2.20462).toFixed(2)),
            carbon_g: parseFloat(((summaryMetrics.total_emissions_co2_kg || 0) * 1000).toFixed(2)),
            raw_payload: {
                metadata: {
                    isTaxEngineOutput: true,
                    statutoryBaseRate: activeLedger.statutory_base_rate_zar_per_tonne || 190.00,
                    freeBasicExemption: activeLedger.free_basic_allowance_exemption_percentage || "60%",
                    taxableEmissionsVolumeMt: activeLedger.taxable_emissions_volume_mt || 0,
                    totalAccruedLiabilityZar: activeLedger.total_accrued_liability_zar || 0,
                    recordsCompiled: taxResult.responsePayload?.total_records_analyzed || 0,
                    filterApplied: taxResult.responsePayload?.filter_applied || {}
                }
            }
        };
        return { intercepted: true, response: NextResponse.json({ success: true, data: structuredTaxLog }, { status: 200 }) };
    }

    return { intercepted: false, response: null };
}
