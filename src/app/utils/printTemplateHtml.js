// /src/app/utils/printTemplateHtml.js

/**
 * Isolated template builder that constructs clean browser print sheets.
 * Keeps structural inline CSS away from core React presentation logic.
 */
export function generatePrintHtml(logNode, matchingAssetNode, activePlateLabel, processedInputSummaryHtml) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EcoRoute Carbon Audit Receipt</title>
        <style>
          body { font-family: ui-mono, monospace, sans-serif; color: #0f172a; background: #ffffff; padding: 40px; font-size: 13px; line-height: 1.6; }
          .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 24px; border-radius: 8px; }
          .section-title { font-size: 11px; font-weight: bold; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .label { color: #64748b; font-size: 10px; text-transform: uppercase; }
          .value { font-weight: bold; color: #0f172a; font-size: 14px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 10px; margin-bottom: 30px; }
          .metric-card { text-align: center; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; background: #f8fafc; }
          .metric-num { font-size: 26px; font-weight: bold; color: #2563eb; margin-bottom: 4px; }
          .metric-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
          .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="title">STIMS ECO ROUTE AUDIT</div></div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div>AUDIT DATE: ${new Date(logNode.created_at).toLocaleDateString('en-ZA')}</div>
            <div>RECORD TIME: ${new Date(logNode.created_at).toLocaleTimeString('en-ZA')}</div>
          </div>
        </div>
        
        <div class="meta-box">
          <div class="section-title">LOGISTICS TRANSACTION SIGNATURE</div>
          <div class="grid">
            <div><span class="label">RECORD ID:</span> <div class="value">${logNode.id}</div></div>
            <div><span class="label">ROUTE ASSESSMENT CLASS:</span> <div class="value">${logNode.category_display}</div></div>
          </div>
        </div>

        <div class="meta-box">
          <div class="section-title">CALCULATION SOURCE RUN INPUTS</div>
          <div class="grid" style="font-size: 12px; color: #334155;">
            ${processedInputSummaryHtml}
          </div>
        </div>

        ${matchingAssetNode ? `
        <div class="meta-box">
          <div class="section-title">ASSIGNED FLEET ASSET DESCRIPTORS</div>
          <div class="grid">
            <div><span class="label">REGISTRATION:</span> <div class="value" style="color: #2563eb;">${activePlateLabel}</div></div>
            <div><span class="label">MANUFACTURER:</span> <div class="value">${matchingAssetNode.make} ${matchingAssetNode.model}</div></div>
          </div>
        </div>
        ` : ''}
        
        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-num">${logNode.carbon_kg}</div><div class="metric-label">Kilograms (KG)</div></div>
          <div class="metric-card"><div class="metric-num">${logNode.carbon_mt}</div><div class="metric-label">Metric Tons</div></div>
          <div class="metric-card"><div class="metric-num">${logNode.carbon_g ? logNode.carbon_g.toLocaleString() : 0}</div><div class="metric-label">Grams (G)</div></div>
          <div class="metric-card"><div class="metric-num">${logNode.carbon_lb}</div><div class="metric-label">Pounds (Lbs)</div></div>
        </div>
        <div class="footer">STIMS Infrastructure Ecosystem Node.</div>
      </body>
      </html>
    `;
}
