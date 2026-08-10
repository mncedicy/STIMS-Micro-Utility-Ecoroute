// /src/app/utils/emailTemplateEngine.js

/**
 * Compiles a clean, printable HTML email body mimicking the STIMS EcoRoute PDF format.
 */
export function generateComplianceEmailHtml({
    currentLocalDate,
    operatorFullLabel,
    enterpriseLabel,
    totalRecordsCount,
    startDate,
    endDate,
    totalKg,
    calculatedMetricTons,
    fleetTotal,
    flightTotal,
    shippingTotal,
    powerUtilitiesTotal,
    displayId
}) {
    return `
        <div style="font-family: monospace; padding: 24px; border: 1px solid #e2e8f0; background-color: #ffffff; color: #334155; max-width: 650px; margin: 0 auto; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: left;">
            
            <!-- BRAND LETTERHEAD MATCHING PDF LAYOUT -->
            <table style="width: 100%; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
                <tr>
                    <td>
                        <h1 style="color: #3b82f6; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 1px;">STIMS ECOROUTE</h1>
                        <p style="font-size: 8px; color: #64748b; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
                            AFRICAN GREENHOUSE GAS COMPLIANCE REGULATORY SUBMISSION REPORT
                        </p>
                    </td>
                </tr>
            </table>

            <!-- STATUS HEADERS BLOCK -->
            <div style="font-size: 9px; color: #64748b; margin-bottom: 20px; line-height: 1.4;">
                <strong>ISSUED:</strong> ${currentLocalDate} | 
                <strong>SECURITY TRACKING:</strong> VERIFIED | 
                <strong>STATUS:</strong> CERTIFIED COMPLIANCE RECORD
            </div>

            <!-- ACCOUNT VERIFICATION METADATA METRICS -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; margin-bottom: 20px; border-radius: 4px;">
                <h4 style="font-size: 10px; font-weight: bold; color: #64748b; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ACCOUNT ENTITY VERIFICATION:
                </h4>
                <div style="font-size: 11px; color: #334155; line-height: 1.5; white-space: pre-line;">
                    <strong>OPERATOR:</strong> ${operatorFullLabel}
                    <strong>ENTERPRISE:</strong> ${enterpriseLabel}
                    <strong>AUDITED TRANSACTION LOGS:</strong> ${totalRecordsCount} RECORDS
                    <strong>AUDIT FILTER RANGE:</strong> ${startDate} TO ${endDate}
                </div>
            </div>

            <!-- RECONCILED FOOTPRINT BLOCK CONTAINER -->
            <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 16px; margin-bottom: 24px; background-color: #ffffff;">
                <span style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; display: block; margin-bottom: 6px;">
                    TOTAL RECONCILED FOOTPRINT VOLUME:
                </span>
                
                <div style="font-size: 20px; font-weight: bold; color: #ef4444; margin-bottom: 2px;">
                    ${totalKg.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} KG CO2e
                </div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 14px; font-weight: bold;">
                    [${totalKg > 0 ? calculatedMetricTons : '0.0000'} METRIC TONS MT]
                </div>

                <!-- SECTOR TIER SPLITS MATRIX -->
                <div style="border-top: 1px dashed #e2e8f0; padding-top: 12px; font-size: 10px; color: #475569; line-height: 1.6;">
                    <div>FLEET METRIC TIER TOTAL : ${fleetTotal.toFixed(0).toLocaleString('en-ZA')} KG CO2e</div>
                    <div>AVIATION SECTOR TOTAL   : ${flightTotal.toFixed(0).toLocaleString('en-ZA')} KG CO2e</div>
                    <div>CARGO SHIPPING TOTAL    : ${shippingTotal.toFixed(0).toLocaleString('en-ZA')} KG CO2e</div>
                    <div>POWER UTILITIES TOTAL   : ${powerUtilitiesTotal.toFixed(0).toLocaleString('en-ZA')} KG CO2e</div>
                </div>
            </div>

            <!-- INFORMATION SUMMARY -->
            <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
                <p style="margin: 0 0 10px 0;">Hello,</p>
                <p style="margin: 0 0 10px 0;">The official compliance carbon audit certificate has been compiled for your review.</p>
                <p style="margin: 0;">An identical, high-resolution copy of this report has been attached to this message as a safe PDF document file.</p>
            </div>

            <!-- FOOTER BLOCK -->
            <div style="font-size: 8px; color: #94a3b8; text-align: left; border-top: 1px solid #e2e8f0; padding-top: 12px; line-height: 1.4;">
                This verified climate data summary calculation overview sheet is generated natively by the secure EcoRoute translation infrastructure.
                <br />
                <span style="color: #cbd5e1;">© 2026 ecoroute.stims.co.za. All rights reserved.</span>
            </div>

        </div>
    `;
}
