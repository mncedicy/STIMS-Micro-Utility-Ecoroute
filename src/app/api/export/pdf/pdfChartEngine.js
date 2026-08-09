// /src/app/api/export/pdf/pdfChartEngine.js

export const drawEmissionsMatrixChart = (doc, logs, categoryTotalsMap) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246);
    doc.text('EMISSIONS ANALYTICS MATRIX', 14, 120);

    // FIXED: Clean minimalist outline frame container on a white page (No dark fill color box)
    doc.setDrawColor(226, 232, 240); // Slate-200 border
    doc.setLineWidth(0.3);
    doc.rect(14, 124, 182, 38, 'D'); // 'D' strokes the border line only with no ink-heavy fills

    // ------------------------------------------------------------------------
    // SUB CHART LEFT SIDE: AGGREGATED RUNNING TOTALS BY CHRONOLOGICAL DATE
    // ------------------------------------------------------------------------
    const dateMap = {};
    logs.forEach(log => {
        const dayKey = log.emission_date || new Date(log.created_at).toISOString().split('T')[0];
        dateMap[dayKey] = (dateMap[dayKey] || 0) + parseFloat(log.carbon_kg || 0);
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b)).slice(-5);
    const maxDateSum = Math.max(...sortedDates.map(d => dateMap[d]), 10);

    let dateX = 18;
    sortedDates.forEach(date => {
        const valueSum = dateMap[date] || 0;
        const barHeightMm = (valueSum / maxDateSum) * 22;
        const barY = 152 - barHeightMm;

        if (valueSum > 0) {
            doc.setFillColor(59, 130, 246); // Electric Blue Primary Data Bar
            doc.rect(dateX + 1, barY, 10, barHeightMm, 'F');
        } else {
            doc.setDrawColor(203, 213, 225);
            doc.line(dateX + 1, 152, dateX + 11, 152);
        }

        // Short formatted date text (e.g. 08 Aug)
        const displayDateStr = new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(valueSum > 0 ? `${valueSum.toFixed(0)}kg` : '0', dateX + 6, barY - 1.5, { align: 'center' });

        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(displayDateStr, dateX + 6, 156, { align: 'center' });

        dateX += 16;
    });

    // Middle separator grid line between both sub-charts
    doc.setDrawColor(226, 232, 240);
    doc.line(102, 126, 102, 158);

    // ------------------------------------------------------------------------
    // SUB CHART RIGHT SIDE: AGGREGATED RUNNING TOTALS BY CATEGORY TIER TYPE
    // ------------------------------------------------------------------------
    const chartKeys = ['VEHICLE', 'FLIGHT', 'SHIPPING', 'POWER', 'GAS'];
    const categoryValues = [
        categoryTotalsMap['VEHICLE'] || 0,
        categoryTotalsMap['FLIGHT'] || 0,
        categoryTotalsMap['SHIPPING'] || 0,
        categoryTotalsMap['ELECTRICITY'] || 0,
        categoryTotalsMap['GAS'] || 0
    ];
    const maxCategorySum = Math.max(...categoryValues, 10);

    let categoryX = 106;
    chartKeys.forEach((key, idx) => {
        const valueSum = categoryValues[idx];
        const barHeightMm = (valueSum / maxCategorySum) * 22;
        const barY = 152 - barHeightMm;

        if (valueSum > 0) {
            doc.setFillColor(16, 185, 129); // Emerald Green Accent Category Bars
            doc.rect(categoryX + 1, barY, 12, barHeightMm, 'F');
        } else {
            doc.setDrawColor(203, 213, 225);
            doc.line(categoryX + 1, 152, categoryX + 13, 152);
        }

        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(valueSum > 0 ? `${valueSum.toFixed(0)}kg` : '0', categoryX + 7, barY - 1.5, { align: 'center' });

        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(key, categoryX + 7, 156, { align: 'center' });

        categoryX += 17;
    });
};
