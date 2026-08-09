// /src/app/api/export/pdf/pdfHeaderEngine.js
import fs from 'fs';
import path from 'path';

export const drawPageHeader = (doc, pageNumber) => {
    // 1. Insert the widened logo from public/logo.png context cleanly
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
            const base64 = fs.readFileSync(logoPath, { encoding: 'base64' });
            doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 14, 11, 16, 8);
        }
    } catch (err) {
        console.warn('[PDF Header Engine] Logo read skipped:', err.message);
    }

    // 2. Main Title Brand Typography
    doc.setFont('courier', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Electric Blue (#3b82f6)
    doc.text('ECOROUTE', 34, 18);

    // 3. Sub-header Compliance Labels
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('AFRICAN GREENHOUSE GAS COMPLIANCE REGULATORY SUBMISSION REPORT', 14, 30);
    doc.text(`ISSUED: ${new Date().toLocaleDateString('en-ZA')} | SECURITY TRACKING VERIFIED | PAGE ${pageNumber}`, 14, 35);

    // 4. Subtle Border Line Under Header
    doc.setLineWidth(0.2);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 39, 196, 39);
};

export const drawTableGridHeaders = (doc, yPos) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setLineWidth(0.3);
    doc.setDrawColor(59, 130, 246); // Blue Accent Grid Split Line
    doc.line(14, yPos, 196, yPos);

    // FIXED: Changed column title layout text string strictly from TIMESTAMP to EMISSION DATE
    doc.text('EMISSION DATE', 16, yPos + 5);

    doc.text('CATEGORY TIER', 65, yPos + 5);
    doc.text('OPERATIONAL METRIC TELEMETRY RANGE', 95, yPos + 5);
    doc.text('FOOTPRINT', 174, yPos + 5);
    doc.line(14, yPos + 7, 196, yPos + 7);
};
