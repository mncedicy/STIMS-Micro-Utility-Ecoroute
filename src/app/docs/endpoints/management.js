// src/app/docs/endpoints/management.js

export const managementEndpoints = [
    {
        id: "bulk_log",
        name: "Bulk Matrix Logger",
        method: "POST",
        path: "/api/v1/bulk-log",
        description: "Ingests and processes mixed parameter arrays of up to 50 concurrent items simultaneously. Applies conditional duplicate reference key filters.",
        headers: [
            { key: "Content-Type", type: "String", required: true, desc: "Set to 'application/json'" },
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "cost_center", type: "String", required: "False", desc: "Global corporate cost center grouping parameter fallback label." },
            { field: "batch_items", type: "Array", required: "True", desc: "A collection array containing up to 50 separate tracking objects." }
        ],
        payloadSchemas: [
            { label: "Mixed Batch Request JSON", code: "{\n  \"cost_center\": \"Durban-Main-Hub\",\n  \"batch_items\": [\n    {\n      \"reference_id\": \"REF_9901_VEH\",\n      \"type\": \"vehicle\",\n      \"vehicle_id\": \"9cd3ed83-4d36-4fc8-857f-f19c0aaa2407\",\n      \"distance\": 124.5,\n      \"unit\": \"km\",\n      \"save_log\": true\n    }\n  ]\n}" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"total_items_processed\": 1,\n  \"total_items_saved\": 1,\n  \"quota_requests_remaining\": 2963,\n  \"results\": [\n    {\n      \"reference_id\": \"REF_9901_VEH\",\n      \"type\": \"vehicle\",\n      \"saved_to_ledger\": true\n    }\n  ]\n}"
    },
    {
        id: "route_check",
        name: "Route Checker",
        method: "POST",
        path: "/api/v1/route-check",
        description: "Pre-dispatch distance simulation using sequential coordinate paths list coordinates array mapped strictly in Google format.",
        headers: [
            { key: "Content-Type", type: "String", required: true, desc: "Set to 'application/json'" },
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "vehicle_id", type: "String", required: "True", desc: "Registered database transport truck or delivery vehicle UUID string hash." },
            { field: "coordinates_string", type: "Array", required: "True", desc: "An array of 2 or more lat/lon coordinate strings matching standard Google format ['lat, lon']." }
        ],
        payloadSchemas: [
            { label: "Route Sequence Request payload", code: "{\n  \"vehicle_id\": \"9cd3ed83-4d36-4fc8-857f-f19c0aaa2407\",\n  \"coordinates_string\": [\n    \"-25.966000, 28.233000\",\n    \"-28.212325, 30.675712\"\n  ]\n}" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"dispatch_status\": \"APPROVED_HAVERSINE_SEQUENCE_ROUTE\",\n  \"route_projection\": {\n    \"actual_distance_km\": 482.6,\n    \"projected_fuel_litres\": 55.50,\n    \"projected_carbon_kg\": 111.000\n  }\n}"
    },
    {
        id: "tax_report",
        name: "Carbon Tax Report",
        method: "GET",
        path: "/api/v1/tax-report",
        description: "Compiles aggregated emissions data matrix lines to compute real-time statutory carbon tax exposure statement balances under SARS constants.",
        headers: [
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "start_date", type: "String", required: "False", desc: "Lower date limit calendar bounding filter (YYYY-MM-DD)." },
            { field: "end_date", type: "String", required: "False", desc: "Upper date limit calendar bounding filter (YYYY-MM-DD)." }
        ],
        payloadSchemas: [
            { label: "Query Parameters Format", code: "GET /api/v1/tax-report?start_date=2026-03-01&end_date=2026-05-31" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"organization\": \"Express Carrier Hub\",\n  \"sars_tax_compliance_ledger\": {\n    \"statutory_base_rate_zar_per_tonne\": 159.00,\n    \"free_basic_allowance_exemption_percentage\": \"60%\",\n    \"taxable_emissions_volume_mt\": 1.6800,\n    \"total_accrued_liability_zar\": 319.20\n  }\n}"
    }
];
