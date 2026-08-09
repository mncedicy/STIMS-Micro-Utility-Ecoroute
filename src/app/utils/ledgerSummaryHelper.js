// /src/app/utils/ledgerSummaryHelper.js

/**
 * Generates a clean text certificate file buffer for bulk summary downloads.
 */
export const compileBulkTextSummary = (startDate, endDate, selectedFilterVehicleId, customVehicles, filteredLogs) => {
    const activeCarNode = customVehicles.find(v => v.id === selectedFilterVehicleId);
    let filterContextLabel = 'ALL DISPATCH RECORD CHANNELS';

    if (activeCarNode) {
        filterContextLabel = `[${activeCarNode.registration_number || 'N/A'}] ${activeCarNode.make} ${activeCarNode.model}`;
    } else if (selectedFilterVehicleId.startsWith('filter_')) {
        filterContextLabel = selectedFilterVehicleId.replace('filter_', '').toUpperCase() + ' SECTOR SUMMARY';
    }

    let textBuffer = `
========================================================================
               STIMS ECOROUTE BULK DATA AUDIT LEDGER                    
========================================================================
FILTER CRITERIA:   ${filterContextLabel.toUpperCase()}
DATE RANGE WINDOW: ${startDate} TO ${endDate}
TOTAL ENTRIES LOG: ${filteredLogs.length}
TIMESTAMP RUN:     ${new Date().toLocaleString('en-ZA')}

HISTORICAL AUDIT MATRIX RUN ENTRIES:
------------------------------------------------------------------------
    `.trim() + '\n';

    filteredLogs.forEach((log, index) => {
        const formattedDate = new Date(log.emission_date).toLocaleDateString('en-ZA');
        textBuffer += `${index + 1}. [${formattedDate}] ${(log.category_display || '').toUpperCase()} -> ${parseFloat(log.carbon_kg || 0).toFixed(1)} kg\n`;
    });

    textBuffer += `
------------------------------------------------------------------------
AGGREGATED CARBON MASS SUM: ${filteredLogs.reduce((acc, curr) => acc + Number(curr.carbon_kg || 0), 0).toFixed(2)} KG CO₂
========================================================================
This document is a certified transaction ledger batch from ecoroute.stims.co.za.
    `.trim();

    return textBuffer;
};

/**
 * Resolves a clear string classification category display label string.
 */
export const resolveBulkCategoryDisplayLabel = (selectedFilterVehicleId) => {
    if (selectedFilterVehicleId === 'all') return 'All Recorded Transactions Consolidated Summary Ledger';
    if (selectedFilterVehicleId === 'filter_flight') return 'Consolidated Aviation Flight Sectors Summary Ledger';
    if (selectedFilterVehicleId === 'filter_shipping') return 'Consolidated Ocean Cargo Freight Summary Ledger';
    if (selectedFilterVehicleId === 'filter_electricity') return 'Consolidated Grid Power Utility Summary Ledger';
    if (selectedFilterVehicleId === 'filter_gas') return 'Consolidated Gas Combustion Account Summary Ledger';
    return 'Isolated Fleet Asset Run Audit History Ledger';
};
