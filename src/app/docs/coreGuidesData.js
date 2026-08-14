// src/app/docs/coreGuidesData.js

export const CORE_GUIDES = {
    introduction: {
        title: "Introduction",
        description: "Welcome to the EcoRoute Core Engine API. Our infrastructure enables enterprises to perform precise, real-time multi-modal logistics audits, carbon tax calculations, and compliance verification under global reporting standards.",
        baseUrlDynamic: true,
        usage: "All requests require a valid live bearer token and must be structured as valid JSON payloads over secure HTTPS channels.",
        code: "curl -X POST '/api/v1/logistics/audit' \\\n  -H 'Authorization: Bearer ecoroute_live_...' \\\n  -H 'Content-Type: application/json'"
    },
    authentication: {
        title: "Authentication",
        description: "EcoRoute APIs authenticate requests using secret bearer tokens. Pass your token via the Authorization HTTP header on every call.",
        code: "Authorization: Bearer ecoroute_live_YOUR_SECRET_TOKEN"
    },
    rateLimits: {
        title: "Rate Limits",
        description: "Corporate accounts are governed by monthly active request tiers. Exceeding your token quota results in a 429 Too Many Requests response envelope."
    },
    pagination: {
        title: "Pagination",
        description: "Large record listings and historical audit queries accept optional 'page' and 'limit' cursor query parameters. The response envelope includes comprehensive metadata regarding total pages and record counts.",
        code: "GET /api/v1/logistics/history?page=2&limit=50",
        codePayload: "{\n  \"pagination\": {\n    \"current_page\": 2,\n    \"per_page\": 50,\n    \"total_records\": 1420,\n    \"total_pages\": 29,\n    \"has_next\": true\n  }\n}"
    },
    errors: {
        title: "Errors",
        description: "EcoRoute uses standard HTTP response status codes coupled with explicit internal error codes to identify operational failures.",
        errorTypes: [
            { code: "400 BAD_REQUEST", desc: "Malformed JSON string or invalid body structure sent in request payload." },
            { code: "401 UNAUTHORIZED", desc: "Missing, expired, or malformed Bearer authorization security token header." },
            { code: "403 FORBIDDEN", desc: "Authenticated token lacks required organizational clearance for this calculation endpoint." },
            { code: "422 UNPROCESSABLE_ENTITY", desc: "Validation fault; required physical fields (e.g. mass, distance, fuel type) are invalid or zero." },
            { code: "429 RATE_LIMIT_EXCEEDED", desc: "Monthly active corporate quota limit reached. Upgrade tier or wait for period reset." },
            { code: "500 INTERNAL_ENGINE_FAULT", desc: "Unexpected compute exception inside the Stims multi-modal emission calculation pipeline." }
        ],
        payloadTitle: "Error Response Envelope Example",
        codePayload: "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"UNPROCESSABLE_ENTITY\",\n    \"status_code\": 422,\n    \"message\": \"Field 'distance' must be a positive quantitative float value.\",\n    \"timestamp\": \"2026-08-14T09:15:00.000Z\"\n  }\n}"
    },
    webhooks: {
        title: "Webhooks",
        description: "Configure your `webhook_destination_url` in your dashboard to receive automated real-time HTTPS POST pushes when critical telemetry benchmarks occur.",
        webhookEvents: [
            { event: "carbon_threshold_alert", desc: "Triggered immediately when aggregate corporate monthly carbon emissions cross 85% of your configured sustainability budget cap." },
            { event: "tax_liability_updated", desc: "Dispatched at midnight SAST whenever South Africa carbon tax liability calculations accrue or adjust based on verified transport logs." },
            { event: "batch_audit_completed", desc: "Fired upon completion of a large multi-modal batch array ingestion job, returning the compiled audit reference identification hash." },
            { event: "quota_exhaustion_warning", desc: "Sent when your monthly request quota is running low (95% consumed), preventing sudden data integration blind spots." }
        ],
        payloadTitle: "Webhook Event Dispatch Payload Example",
        codePayload: "{\n  \"event\": \"carbon_threshold_alert\",\n  \"organization\": \"Enterprise Logistics Ltd\",\n  \"timestamp\": \"2026-08-14T09:20:00.000Z\",\n  \"payload\": {\n    \"accrued_tax_zar\": 14500.00,\n    \"threshold_limit_zar\": 20000.00\n  }\n}"
    }
};
