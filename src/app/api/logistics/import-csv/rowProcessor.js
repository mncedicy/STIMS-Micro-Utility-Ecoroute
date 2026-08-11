// /src/app/api/logistics/import-csv/rowProcessor.js
import { processCategoryEmissions } from '../../estimates/categoryPipeline';
import { formatEmissionPayload } from '@/app/utils/massFormatter';
import { sanitizeCountryCode } from './parameterGuard';

/**
 * Validates, calculates, and transforms a single spreadsheet row into a database log record.
 */
export async function processRowEntry({ row, user, bearerToken, file, activeLineIndex, taxRatePerTon, freeAllowancePercent }) {
    const type = row.type || row.category;
    if (!type) throw new Error('Mandatory tracking column "Type" is blank or missing.');

    const cleanType = type.toLowerCase().trim();
    const countryToken = sanitizeCountryCode(row.country || row.country_code);

    // Extract custom cost-center or department columns cleanly
    const rowCostCenter = row.cost_center || row.department || row.branch || 'Unassigned';
    const sanitizedCostCenter = rowCostCenter.toString().trim().substring(0, 100);

    // Standardize field options for the emissions pipeline
    const computationForm = {
        type: cleanType,
        distance: row.distance || '0',
        unit: row.unit || 'km',
        vehicle_id: row.vehicle_id || null,
        origin_iata: row.origin || row.origin_iata || null,
        dest_iata: row.destination || row.dest_iata || null,
        passengers: row.passengers || '1',
        cargo_weight: row.cargo_weight || '0',
        mass_unit: row.mass_unit || 'kg',
        kwh: row.kwh || '0',
        country_code: countryToken,
        quantity: row.quantity || '0',
        gas_type: row.gas_type || 'NATURAL_GAS',
        gas_unit: row.gas_unit || 'm3'
    };

    // Execute core greenhouse gas carbon metrics calculations
    const { calculatedKg, metadataLog } = await processCategoryEmissions(cleanType, computationForm, bearerToken);
    const conversions = formatEmissionPayload(calculatedKg);

    const resolvedDate = row.date && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
        ? row.date
        : new Date().toISOString().split('T')[0];

    // Compute row-level incremental global carbon tax exposure costs
    const incrementalTonnes = parseFloat(conversions.carbon_mt || (calculatedKg / 1000));
    const taxableTonnesFactor = incrementalTonnes * (1 - (freeAllowancePercent / 100));
    const rowAccruedTaxZar = taxableTonnesFactor * taxRatePerTon;

    // Generate unique row identifier to avoid file re-upload conflicts
    const userProvidedRefId = row.reference_id || row.manifest_id || row.row_id;
    const uniqueReferenceKey = userProvidedRefId
        ? userProvidedRefId.trim()
        : `auto_line_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${activeLineIndex}`;

    const logRecord = {
        user_id: user.id,
        vehicle_id: cleanType === 'vehicle' ? computationForm.vehicle_id : null,
        category_display: cleanType.toUpperCase(),
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
        log_source_channel: 'SPREADSHEET_BATCH_UPLOAD',
        batch_manifest_row_id: uniqueReferenceKey,
        cost_center: sanitizedCostCenter,
        raw_payload: { ...conversions, metadata: metadataLog }
    };

    return { logRecord, uniqueReferenceKey, rowAccruedTaxZar };
}
