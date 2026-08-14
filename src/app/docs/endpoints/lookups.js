// src/app/docs/endpoints/lookups.js

export const lookupEndpoints = [
    {
        id: "history",
        name: "Emission History",
        method: "GET",
        path: "/api/v1/history",
        description: "Retrieves complete transactional records ledger history rows lists. Free operation: does NOT bump or draw down your corporate request token usage allowance.",
        headers: [
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "limit", type: "Integer", required: "False", desc: "Defines maximum data list density response bounds (default: 50, max: 100)." }
        ],
        payloadSchemas: [
            { label: "Query Filter Syntax", code: "GET /api/v1/history?limit=25" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"total_records\": 1,\n  \"history\": [\n    {\n      \"id\": \"f81d4fae-7dec-11d0-a765-00a0c91e6bf6\",\n      \"category_display\": \"VEHICLE\",\n      \"distance_km\": 310.2,\n      \"carbon_kg\": 71.346\n    }\n  ]\n}"
    },
    {
        id: "vehicles",
        name: "Vehicle Roster",
        method: "GET",
        path: "/api/v1/vehicles",
        description: "Fetches active tracking elements, model descriptors, and carbon multipliers associated with your profile. Free read query action.",
        headers: [
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "limit", type: "Integer", required: "False", desc: "Maximum registered asset objects returned per view list query." }
        ],
        payloadSchemas: [
            { label: "Roster Request Configuration", code: "GET /api/v1/vehicles?limit=50" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"total_vehicles\": 1,\n  \"vehicles\": [\n    {\n      \"id\": \"9cd3ed83-4d36-4fc8-857f-f19c0aaa2407\",\n      \"make\": \"Aston Martin\",\n      \"model\": \"DB12 V8\",\n      \"carbon_multiplier\": 0.230\n    }\n  ]\n}"
    },
    {
        id: "airports",
        name: "Airport Registry",
        method: "GET",
        path: "/api/v1/airports",
        description: "Queries high-volume 50,000-row stationary airport hub directories safely avoiding performance lag. Free read query implementation.",
        headers: [
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "continent", type: "String", required: "False", desc: "Filter by 2-character continent uppercase zone identifier string (e.g. 'AF')." },
            { field: "iso_country", type: "String", required: "False", desc: "Filter by 2-character country uppercase identifier code (e.g. 'ZA')." },
            { field: "page", type: "Integer", required: "False", desc: "The pagination tracking index cursor window (default: 1)." }
        ],
        payloadSchemas: [
            { label: "Paginated Airport Lookup Syntax", code: "GET /api/v1/airports?continent=AF&iso_country=ZA&page=1&limit=2" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"pagination\": { \"total_records\": 134, \"current_page\": 1, \"per_page\": 2 },\n  \"airports\": [\n    { \"id\": 31055, \"name\": \"Cape Town International\", \"municipality\": \"Cape Town\" }\n  ]\n}"
    },
    {
        id: "countries",
        name: "Country Directory",
        method: "GET",
        path: "/api/v1/countries",
        description: "Lists active stationary international boundary ISO codes matrix direct reference mappings records data cleanly without pagination. Free read operation.",
        headers: [
            { key: "Authorization", type: "String", required: true, desc: "Bearer token signature block" }
        ],
        parameters: [
            { field: "continent", type: "String", required: "False", desc: "Filter response rows matrix by regional continent block designation." }
        ],
        payloadSchemas: [
            { label: "Directory Filter Query", code: "GET /api/v1/countries?continent=AF" }
        ],
        downloads: [],
        response: "{\n  \"success\": true,\n  \"total_countries\": 54,\n  \"countries\": [\n    { \"id\": 182, \"code\": \"ZA\", \"name\": \"South Africa\", \"continent\": \"AF\" }\n  ]\n}"
    }
];
