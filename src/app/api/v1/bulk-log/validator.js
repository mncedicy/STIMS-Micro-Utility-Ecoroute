// src/app/api/v1/bulk-log/validator.js

export function validateBatchPayload(body) {
    if (!body || typeof body !== 'object') {
        return { error: 'Bad Payload: Request body must be a valid JSON object.' };
    }

    const { batch_items } = body;
    if (!batch_items || !Array.isArray(batch_items) || batch_items.length === 0) {
        return { error: 'Validation Fault: A non-empty batch_items array is required.' };
    }

    if (batch_items.length > 50) {
        return { error: 'Validation Fault: Batch items count exceeds maximum allowance of 50 per request.' };
    }

    const allowedCategories = ['vehicle', 'flight', 'shipping', 'electricity', 'gas'];
    const localBatchRefIdsSet = new Set();

    for (let i = 0; i < batch_items.length; i++) {
        const item = batch_items[i];
        const lineNum = i + 1;
        const type = item.type || item.category;
        const shouldSave = item.save_log !== false;

        // --- reference_id is ONLY required if save_log is true ---
        if (shouldSave) {
            if (!item.reference_id || typeof item.reference_id !== 'string' || !item.reference_id.trim()) {
                return { error: `Validation Error: Mandatory property "reference_id" is missing or invalid since save_log is true at index item #${lineNum}.` };
            }

            const uniqueKey = item.reference_id.trim();
            if (localBatchRefIdsSet.has(uniqueKey)) {
                return { error: `Validation Error: Duplicate reference_id tracking key "${uniqueKey}" detected within the same batch at item #${lineNum}.` };
            }
            localBatchRefIdsSet.add(uniqueKey);
        }

        if (!type || typeof type !== 'string') {
            return { error: `Validation Error: Mandatory property "type" is blank or missing at index item #${lineNum}.` };
        }

        const cleanType = type.toLowerCase().trim();
        if (!allowedCategories.includes(cleanType)) {
            return { error: `Validation Error: Unsupported category tier "${type}" at item #${lineNum}.` };
        }

        if (cleanType === 'vehicle') {
            if (!item.vehicle_id || typeof item.vehicle_id !== 'string') {
                return { error: `Validation Error: Land vehicle operations requires a valid "vehicle_id" at item #${lineNum}.` };
            }
            if (isNaN(parseFloat(item.distance)) || parseFloat(item.distance) <= 0) {
                return { error: `Validation Error: Field "distance" must be > 0 at item #${lineNum}.` };
            }
        } else if (cleanType === 'flight') {
            const origin = item.origin_identifier || item.origin_iata;
            const dest = item.dest_identifier || item.dest_iata;
            if (!origin || !dest) {
                return { error: `Validation Error: Flight logging requires origin/destination IDs at item #${lineNum}.` };
            }
            if (String(origin).trim() === String(dest).trim()) {
                return { error: `Validation Error: Terminal Collision Guard at item #${lineNum}. Origin cannot match destination.` };
            }
        } else if (cleanType === 'shipping') {
            if (isNaN(parseFloat(item.distance)) || parseFloat(item.distance) <= 0 || isNaN(parseFloat(item.cargo_weight)) || parseFloat(item.cargo_weight) <= 0) {
                return { error: `Validation Error: Cargo requires positive distance and weight at item #${lineNum}.` };
            }
        } else if (cleanType === 'electricity') {
            if (isNaN(parseFloat(item.energy_kwh || item.kwh)) || parseFloat(item.energy_kwh || item.kwh) <= 0) {
                return { error: `Validation Error: Grid power requires positive energy_kwh at item #${lineNum}.` };
            }
        } else if (cleanType === 'gas') {
            if (isNaN(parseFloat(item.gas_quantity || item.quantity)) || parseFloat(item.gas_quantity || item.quantity) <= 0) {
                return { error: `Validation Error: Combustion requires positive gas_quantity at item #${lineNum}.` };
            }
        }
    }

    return { success: true };
}
