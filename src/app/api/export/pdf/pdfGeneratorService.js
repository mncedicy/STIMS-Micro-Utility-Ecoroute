// /src/app/api/export/pdf/pdfGeneratorService.js
import jsPDF from 'jspdf';
import { drawPageHeader, drawTableGridHeaders } from './pdfHeaderEngine';
import { drawEmissionsMatrixChart } from './pdfChartEngine';

export function buildCompliancePdfBuffer(profile, logs = [], subtitleContextRange) {
    let totalKg = 0;
    const categoryTotalsMap = { VEHICLE: 0, FLIGHT: 0, SHIPPING: 0, ELECTRICITY: 0, GAS: 0 };

    // Accumulate total mass parameters grouped precisely by category split keys
    logs.forEach(log => {
        const massVal = parseFloat(log.carbon_kg || 0);
        totalKg += massVal;

        const cat = (log.category_display || 'VEHICLE').toUpperCase();
        if (categoryTotalsMap[cat] !== undefined) {
            categoryTotalsMap[cat] += massVal;
        }
    });

    const totalMT = (totalKg / 1000).toFixed(4);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Render page headers (Clean ink-saving white styling layout)
    drawPageHeader(doc, 1);

    // Profile verification headers blocks
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('ACCOUNT ENTITY VERIFICATION:', 14, 52);
    doc.setFont('courier', 'bold');
    doc.text(`OPERATOR: ${profile?.first_name?.toUpperCase() || 'N/A'} ${profile?.surname?.toUpperCase() || ''}`, 14, 58);
    doc.text(`ENTERPRISE: ${profile?.company?.toUpperCase() || 'INDEPENDENT CARRIER'}`, 14, 64);

    // FIXED: Embedded explicit dynamic audited transaction records count inside the identity letterhead parameters block
    doc.text(`AUDITED TRANSACTION LOGS: ${logs.length} RECORDS`, 14, 70);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(subtitleContextRange.toUpperCase(), 14, 75);

    // Upper Reconciled Footprint Block Panel Container (Clean white layout outline)
    doc.setDrawColor(226, 232, 240); // Slate-200 border lines
    doc.setLineWidth(0.3);
    doc.rect(14, 80, 182, 32, 'D'); // 'D' draws the border line outline only without a dark fill background color

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('TOTAL RECONCILED FOOTPRINT VOLUME:', 18, 88);

    doc.setFont('courier', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(239, 68, 68); // Crimson red alert color metric output
    doc.text(`${totalKg.toLocaleString('en-ZA')} KG CO2e`, 18, 97);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${totalMT} METRIC TONS MT]`, 18, 104);

    // Displays dynamic aggregated carbon mass summary totals by category tier type
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500 text alignments

    const fleetMassTotal = (categoryTotalsMap['VEHICLE']).toFixed(0);
    const flightMassTotal = (categoryTotalsMap['FLIGHT']).toFixed(0);
    const cargoMassTotal = (categoryTotalsMap['SHIPPING']).toFixed(0);
    const utilityMassTotal = (categoryTotalsMap['ELECTRICITY'] + categoryTotalsMap['GAS']).toFixed(0);

    doc.text(`FLEET METRIC TIER TOTAL : ${fleetMassTotal.toLocaleString('en-ZA')} KG CO2e`, 114, 87);
    doc.text(`AVIATION SECTOR TOTAL   : ${flightMassTotal.toLocaleString('en-ZA')} KG CO2e`, 114, 92);
    doc.text(`CARGO SHIPPING TOTAL    : ${cargoMassTotal.toLocaleString('en-ZA')} KG CO2e`, 114, 97);
    doc.text(`POWER UTILITIES TOTAL   : ${utilityMassTotal.toLocaleString('en-ZA')} KG CO2e`, 114, 102);

    // --- DRAW DUAL EMISSIONS MATRIX BAR GRAPH SUB-CHART PANEL ---
    drawEmissionsMatrixChart(doc, logs, categoryTotalsMap);

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246);
    doc.text('ITEMIZED DATA LOG TRANSACTION LEDGER', 14, 175);

    drawTableGridHeaders(doc, 178);

    let currentY = 191;
    let activePageCounter = 1;

    logs.forEach((log) => {
        if (currentY > 270) {
            doc.addPage();
            activePageCounter++;
            drawPageHeader(doc, activePageCounter);
            drawTableGridHeaders(doc, 48);
            currentY = 61;
        }

        const dateStr = log.emission_date
            ? new Date(log.emission_date).toLocaleDateString('en-ZA')
            : new Date(log.created_at).toLocaleDateString('en-ZA');

        const sourceStr = (log.log_source_channel || 'WEB').substring(0, 8);
        const categoryStr = (log.category_display || '').toUpperCase();
        let telemetryRangeStr = '';
        const payloadObject = typeof log.raw_payload === 'string' ? JSON.parse(log.raw_payload) : (log.raw_payload || {});

        if (categoryStr === 'VEHICLE') {
            telemetryRangeStr = `${log.input_distance || 0}${log.input_unit || 'km'} [${payloadObject?.metadata?.vehicleProfile || 'Fleet Asset'}]`;
        }
        else if (categoryStr === 'SHIPPING') {
            telemetryRangeStr = `Dist: ${log.input_distance || 0}${log.input_unit || 'km'} | Wt: ${log.cargo_weight || 0}${log.mass_unit || 'kg'}`;
        }
        else if (categoryStr === 'FLIGHT') {
            const meta = payloadObject?.metadata || {};
            const paxCount = log.passengers_count || meta.passengers || 1;
            if (meta.origin_name && meta.destination_name) {
                const cleanOrigin = meta.origin_name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 9).trim();
                const cleanDest = meta.destination_name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 9).trim();
                telemetryRangeStr = `${cleanOrigin}(${(meta.origin_country || 'N/A').trim().toUpperCase()}) - ${cleanDest}(${(meta.destination_country || 'N/A').trim().toUpperCase()}) [${paxCount}pax]`;
            } else {
                telemetryRangeStr = `${log.origin_iata || 'N/A'} - ${log.dest_iata || 'N/A'} [${paxCount}pax]`;
            }
        }
        else if (categoryStr === 'ELECTRICITY') {
            telemetryRangeStr = `${log.energy_kwh || 0} kWh [Grid: ${log.country_code || 'ZA'}]`;
        }
        else if (categoryStr === 'GAS') {
            telemetryRangeStr = `${log.gas_quantity || 0} ${log.gas_unit || 'm3'} [${log.gas_type || 'GAS'}]`;
        }

        doc.setFont('courier', 'normal');
        doc.setTextColor(51, 65, 85); // High contrast on white page layout grid
        doc.text(`${dateStr} [${sourceStr}]`, 16, currentY);
        doc.text(categoryStr, 65, currentY);
        doc.text(telemetryRangeStr.substring(0, 37), 95, currentY);
        doc.text(`${parseFloat(log.carbon_kg || 0).toFixed(1)} KG`, 174, currentY, { align: 'left' });

        currentY += 6;
    });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This verified climate data summary calculation overview sheet is generated natively by the secure EcoRoute translation infrastructure.', 14, 288);

    return doc.output('arraybuffer');
}
