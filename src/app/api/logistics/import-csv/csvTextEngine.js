// /src/app/api/logistics/import-csv/csvTextEngine.js

/**
 * Tokenizes raw text robustly, matching values securely by case-insensitive column header names.
 */
export function parseCSVTextToJSON(csvText) {
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
    if (lines.length < 2) return [];

    // Extract headers and sanitize text blocks cleanly
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === 0 || (currentLine.length === 1 && currentLine[0] === '')) continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            const rawVal = currentLine[j];
            obj[headers[j]] = rawVal ? rawVal.trim().replace(/["']/g, '') : '';
        }
        results.push(obj);
    }
    return results;
}
