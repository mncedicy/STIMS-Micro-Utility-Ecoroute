// src/app/utils/dateHelpers.js

/**
 * Compiles real-time date configuration objects cleanly for form inputs
 */
export function getFormInitialDates() {
    const currentDateObj = new Date();
    const todayString = currentDateObj.toISOString().split('T')[0];

    // Subtract exactly 1 month to establish the baseline start month boundary
    const pastDateObj = new Date();
    pastDateObj.setMonth(pastDateObj.getMonth() - 1);
    const defaultStartMonthString = pastDateObj.toISOString().split('T')[0];

    return {
        todayString,
        defaultStartMonthString
    };
}
