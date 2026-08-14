// src/app/api/v1/bulk-log/calculator.js

import { processCategoryEmissions } from '../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { sanitizeCountryCode } from '../../logistics/import-csv/parameterGuard';
import { CARBON_TAX_BASE_RATE_ZAR, STANDARD_FREE_ALLOWANCE_EXEMPTION } from '../config/apiConfig';

export async function processItemCalculation(item, defaultCostCenter, apiKeyToken) {
    const cleanType = (item.type || item.category).toLowerCase().trim();
    const countryToken = sanitizeCountryCode(item.country || item.country_code);
    const rowCostCenter = item.cost_center || defaultCostCenter || 'Unassigned';
    const shouldSave = item.save_log !== false;

    const computationForm = {
        type: cleanType,
        distance: item.distance || '0',
        unit: item.unit || 'km',
        vehicle_id: item.vehicle_id || null,
        origin_iata: item.origin_identifier || item.origin_iata || null,
        dest_iata: item.dest_identifier || item.dest_iata || null,
        passengers: item.passengers || '1',
        cargo_weight: item.cargo_weight || '0',
        mass_unit: item.mass_unit || 'kg',
        kwh: item.energy_kwh || item.kwh || '0',
        country_code: countryToken,
        quantity: item.gas_quantity || item.quantity || '0',
        gas_type: item.gas_type || 'NATURAL_GAS',
        gas_unit: item.gas_unit || 'm3'
    };

    const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, computationForm, apiKeyToken);
    const conversions = formatEmissionPayload(calculatedKg);

    const incrementalTonnes = parseFloat(conversions.carbon_mt || (calculatedKg / 1000));
    const taxableTonnesFactor = incrementalTonnes * (1 - STANDARD_FREE_ALLOWANCE_EXEMPTION);
    const rowAccruedTaxZar = taxableTonnesFactor * CARBON_TAX_BASE_RATE_ZAR;

    const resolvedDate = item.emission_date && /^\d{4}-\d{2}-\d{2}$/.test(item.emission_date)
        ? item.emission_date
        : new Date().toISOString().split('T');

    const uniqueReferenceKey = shouldSave
        ? String(item.reference_id).trim()
        : `dry_run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const ledgerPayload = shouldSave ? {
        category_display: cleanType.toUpperCase(),
        vehicle_id: cleanType === 'vehicle' ? computationForm.vehicle_id : null,
        carbon_kg: conversions.carbon_kg,
        carbon_g: conversions.carbon_g,
        carbon_mt: conversions.carbon_mt,
        carbon_lb: conversions.carbon_lb,
        input_distance: ['vehicle', 'shipping'].includes(cleanType) ? parseFloat(computationForm.distance) : null,
        input_unit: ['vehicle', 'shipping'].includes(cleanType) ? computationForm.unit : null,
        origin_iata: cleanType === 'flight' ? computationForm.origin_iata?.substring(0, 3).toUpperCase() : null,
        dest_iata: cleanType === 'flight' ? computationForm.dest_iata?.substring(0, 3).toUpperCase() : null,
        passengers_count: cleanType === 'flight' ? parseInt(computationForm.passengers, 10) : null,
        cargo_weight: cleanType === 'shipping' ? parseFloat(computationForm.cargo_weight) : null,
        mass_unit: cleanType === 'shipping' ? computationForm.mass_unit : null,
        energy_kwh: cleanType === 'electricity' ? parseFloat(computationForm.kwh) : null,
        country_code: countryToken,
        gas_quantity: cleanType === 'gas' ? parseFloat(computationForm.quantity) : null,
        gas_type: cleanType === 'gas' ? computationForm.gas_type : null,
        gas_unit: cleanType === 'gas' ? computationForm.gas_unit : null,
        emission_date: resolvedDate,
        log_source_channel: 'BULK_API_TUNNEL',
        batch_manifest_row_id: uniqueReferenceKey,
        cost_center: rowCostCenter.toString().trim().substring(0, 100),
        raw_payload: { ...conversions, metadata: metadataLog }
    } : null;

    return {
        cleanType,
        resolvedDate,
        conversions,
        rowAccruedTaxZar,
        uniqueReferenceKey,
        ledgerPayload,
        savedToLedger: shouldSave
    };
}
