// /src/app/utils/ledgerPrintHelper.js
import { generateBulkPrintHtml } from './printTemplateHtml';

/**
 * Creates a hidden iframe to print the filtered logs list directly.
 */
export const executeLedgerPrint = (startDate, endDate, selectedFilterVehicleId, customVehicles, filteredLogs) => {
    if (filteredLogs.length === 0) return;

    const printWindowElement = document.createElement('iframe');
    printWindowElement.style.position = 'fixed';
    printWindowElement.style.right = '0';
    printWindowElement.style.bottom = '0';
    printWindowElement.style.width = '0';
    printWindowElement.style.height = '0';
    printWindowElement.style.border = 'none';

    document.body.appendChild(printWindowElement);

    const activeCarNode = customVehicles.find(v => v.id === selectedFilterVehicleId);
    let filterContextLabel = 'ALL DISPATCH RECORD CHANNELS';

    if (activeCarNode) {
        filterContextLabel = `ASSET FLEET: [${activeCarNode.registration_number || 'N/A'}] ${activeCarNode.make} ${activeCarNode.model}`;
    } else if (selectedFilterVehicleId.startsWith('filter_')) {
        filterContextLabel = `ISOLATED SEGMENT INDEX: ${selectedFilterVehicleId.replace('filter_', '').toUpperCase()}`;
    }

    const doc = printWindowElement.contentWindow.document;
    doc.open();
    // FIXED: Passes the isolated filteredLogs array to the print layout compiler natively
    doc.write(generateBulkPrintHtml(startDate, endDate, filterContextLabel, filteredLogs));
    doc.close();

    printWindowElement.contentWindow.focus();
    setTimeout(() => {
        printWindowElement.contentWindow.print();
        document.body.removeChild(printWindowElement);
    }, 400);
};
