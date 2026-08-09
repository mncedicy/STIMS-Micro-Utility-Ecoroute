// /src/app/api/v1/logistics/audit/apiValidationCore.js

/**
 * Validates the API Token registry row configuration status.
 */
export function validateTokenStatus(tokenRecord, tokenError) {
    if (tokenError || !tokenRecord) {
        return { error: 'Authorization Failed: Provided access signature credentials are invalid.', status: 403 };
    }
    if (!tokenRecord.is_active) {
        return { error: 'Authorization Failed: This corporate connection channel has been deactivated.', status: 403 };
    }
    if (tokenRecord.current_monthly_usage >= tokenRecord.usage_limit_cap) {
        return { error: 'Quota Exceeded: Monthly transaction limits reached (100,000 requests cap).', status: 429 };
    }
    return null;
}

/**
 * Enforces strict chronological date boundaries.
 */
export function validateEmissionDate(inputDate) {
    if (!inputDate || typeof inputDate !== 'string') {
        return 'Validation Error: Field "emission_date" is malformed or empty.';
    }

    // Strict RegEx structure matching format: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
        return 'Validation Error: Field "emission_date" must follow strict ISO sequence formatting rules (YYYY-MM-DD).';
    }

    if (isNaN(Date.parse(inputDate))) {
        return 'Validation Error: Field "emission_date" represents an invalid historical calendar day.';
    }

    // Capture today's exact date segment (2026-08-08)
    const todayDateString = new Date().toISOString().split('T')[0];
    if (inputDate > todayDateString) {
        return `Validation Error: Entry transaction date (${inputDate}) cannot be in the future. Maximum allowed limit is ${todayDateString}.`;
    }

    if (inputDate < '2020-01-01') {
        return 'Validation Error: Retrospective compliance logging bounds are constrained. System restricts inputs before calendar threshold 2020-01-01.';
    }

    return null; // Passes validation checks
}
