// src/app/docs/endpoints/audit.js

export const auditEndpoint = {
    id: "audit",
    name: "Audit Calculator",
    method: "POST",
    path: "/api/v1/logistics/audit",
    description: "Executes real-time multi-category emissions footprint audits with organization quota tracking and ledger verification across 5 distinct modality profiles.",
    headers: [
        { key: "Content-Type", type: "String", required: true, desc: "Set strictly to 'application/json'" },
        { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block (e.g., 'Bearer ecoroute_live_...')" }
    ],
    parameters: [
        { field: "type", type: "String", required: "True", desc: "Category tier. Options: 'vehicle', 'flight', 'shipping', 'electricity', 'gas'." },
        { field: "reference_id", type: "String", required: "Conditional", desc: "Required if save_log is true. Unique manifest key to block double logging." },
        { field: "vehicle_id", type: "String", required: "Conditional", desc: "Required for land vehicles. String UUID matching an asset key from fleet registry." },
        { field: "distance", type: "Decimal", required: "Conditional", desc: "Required for vehicle and shipping. Positive decimal tracking value." },
        { field: "unit", type: "String", required: "Conditional", desc: "Measurement unit parameter. Accepts 'km' or 'miles'." },
        { field: "origin_identifier / dest_identifier", type: "String", required: "Conditional", desc: "Required for aviation flights. Numeric airport lookup keys." },
        { field: "passengers", type: "Integer", required: "False", desc: "Flight occupants count tracking boundaries. Defaults to 1." },
        { field: "cargo_weight / mass_unit", type: "Mixed", required: "Conditional", desc: "Required for shipping freight. Mass unit accepts 'kg', 'lbs', or 'tonnes'." },
        { field: "energy_kwh / country_code", type: "Mixed", required: "Conditional", desc: "Required for grid power. Electricity units paired with 2-char country ISO code." },
        { field: "gas_quantity / gas_type / gas_unit", type: "Mixed", required: "Conditional", desc: "Required for gas combustion. Gas type accepts 'NATURAL_GAS' or 'LPG'." },
        { field: "emission_date", type: "String", required: "False", desc: "Format YYYY-MM-DD. Future dates are blocked. Defaults to today." },
        { field: "save_log", type: "Boolean", required: "False", desc: "Defaults to true. If false, calculates footprint but skips database write while still decrementing quota." }
    ],
    payloadSchemas: [
        { label: "1. Land Vehicles", code: "{\n  \"reference_id\": \"YOUR_UNIQUE_REF_001\",\n  \"type\": \"vehicle\",\n  \"vehicle_id\": \"YOUR_UUID\",\n  \"distance\": 124.5,\n  \"unit\": \"km\",\n  \"emission_date\": \"2026-08-01\",\n  \"save_log\": true\n}" },
        { label: "2. Aviation Flights", code: "{\n  \"reference_id\": \"YOUR_UNIQUE_REF_002\",\n  \"type\": \"flight\",\n  \"origin_identifier\": \"31055\",\n  \"dest_identifier\": \"2775\",\n  \"passengers\": 7,\n  \"emission_date\": \"2026-08-05\",\n  \"save_log\": true\n}" },
        { label: "3. Cargo Freight Shipping", code: "{\n  \"reference_id\": \"YOUR_UNIQUE_REF_003\",\n  \"type\": \"shipping\",\n  \"cargo_weight\": 18500.0,\n  \"mass_unit\": \"kg\",\n  \"distance\": 840.2,\n  \"unit\": \"km\",\n  \"emission_date\": \"2026-08-06\",\n  \"save_log\": true\n}" },
        { label: "4. Grid Power Electricity", code: "{\n  \"reference_id\": \"YOUR_UNIQUE_REF_004\",\n  \"type\": \"electricity\",\n  \"energy_kwh\": 4500.75,\n  \"country_code\": \"ZA\",\n  \"emission_date\": \"2026-08-07\",\n  \"save_log\": true\n}" },
        { label: "5. Gas Fuel Combustion", code: "{\n  \"reference_id\": \"YOUR_UNIQUE_REF_005\",\n  \"type\": \"gas\",\n  \"gas_quantity\": 120.0,\n  \"gas_type\": \"LPG\",\n  \"gas_unit\": \"kg\",\n  \"emission_date\": \"2026-08-08\",\n  \"save_log\": true\n}" }
    ],
    downloads: [
        { label: "📥 Download Airport List CSV", href: "/downloads/airports_registry.csv" },
        { label: "📥 Download Vehicle List CSV", href: "/downloads/vehicles_roster.csv" }
    ],
    response: "{\n  \"success\": true,\n  \"status\": \"TRANSACTION_AUDIT_VERIFIED\",\n  \"timestamp\": \"2026-08-08T01:45:00.000Z\",\n  \"organization\": \"Your Enterprise Profile Name\",\n  \"quota_requests_remaining\": 99942,\n  \"metrics\": {\n    \"carbon_kg\": 230.20,\n    \"carbon_g\": 230200,\n    \"carbon_mt\": 0.2302,\n    \"carbon_lb\": 507.5\n  },\n  \"telemetry\": {\n    \"userAssignedDate\": \"2026-08-08\",\n    \"processedViaSecureTunnel\": true\n  },\n  \"record\": {\n    \"id\": \"c7b508f2-11da-4bc3-9fae-cc9231f82110\"\n  }\n}"
};
