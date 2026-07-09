export function generateCertificateHtml(log) {
    const p = log.raw_payload || {};
    const isVehicle = log.category_display.toLowerCase().includes('vehicle');
    const isShipping = log.category_display.toLowerCase().includes('shipping');

    // Short conditional parameters mapping text logic
    const row1Label = isVehicle ? 'Vehicle Profile' : isShipping ? 'Cargo Weight' : 'Flight Sector';
    const row1Val = isVehicle ? `${p.vehicle_make} ${p.vehicle_model}` : isShipping ? `${p.weight_value} ${p.weight_unit}` : `${p.airport_origin} ➔ ${p.airport_destination}`;

    const row2Label = isVehicle ? 'Audited Route' : isShipping ? 'Freight Voyage' : 'Manifest Passengers';
    const row2Val = isVehicle || isShipping ? `${p.distance_value} ${p.distance_unit}` : `${p.passengers || 1} Pax`;

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>EcoRoute Audit - ${log.id.slice(0, 8)}</title>
      <script src="https://tailwindcss.com"></script>
      <style>
          @import url('https://googleapis.com');
          body { font-family: 'Inter', sans-serif; background: #f8fafc; }
          @media print { .no-print { display: none !important; } body { background: white; } }
      </style>
  </head>
  <body class="p-4 md:p-12 flex flex-col items-center justify-center min-h-screen">

      <div class="w-full max-w-xl flex justify-between items-center mb-6 no-print bg-white border p-4 rounded-xl shadow-sm">
          <span class="text-xs text-slate-500 font-medium">🌱 OFFICIAL LEDGER RECORD VERIFIED</span>
          <button onclick="window.print()" class="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">Export PDF</button>
      </div>

      <div class="w-full max-w-xl bg-white border rounded-2xl p-8 md:p-10 shadow-md space-y-6">
          <div class="flex justify-between border-b pb-4">
              <div>
                  <h1 class="text-xl font-bold tracking-tight text-slate-900">CARBON COMPLIANCE RECORD</h1>
                  <p class="text-[9px] text-slate-400 font-medium uppercase mt-0.5">ECOROUTE AUDITING LAYER • ECOROUTE.STIMS.CO.ZA</p>
              </div>
              <span class="text-2xl">🌱</span>
          </div>

          <div class="space-y-2 text-xs border-b pb-4">
              <div class="flex justify-between">
                  <span class="text-slate-400">Token ID:</span><span class="font-mono text-slate-900 select-all">${log.id}</span>
              </div>
              <div class="flex justify-between">
                  <span class="text-slate-400">Timestamp:</span><span class="text-slate-700">${new Date(log.created_at).toUTCString()}</span>
              </div>
              <div class="flex justify-between">
                  <span class="text-slate-400">Framework:</span><span class="font-bold text-blue-600 uppercase text-[11px]">${log.category_display}</span>
              </div>
          </div>

          <div class="bg-slate-900 text-white rounded-xl p-5">
              <span class="text-[9px] font-bold text-emerald-400 block uppercase mb-0.5">AUDITED CARBON FOOTPRINT IMPACT</span>
              <div class="text-3xl font-extrabold">${log.carbon_kg} <span class="text-sm font-medium text-slate-400">kg CO2e</span></div>
          </div>

          <div class="space-y-2 text-xs">
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">TRANSIT MANIFEST SUMMARY</h3>
              <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">${row1Label}</span><span class="font-semibold">${row1Val}</span></div>
              <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">${row2Label}</span><span class="font-semibold">${row2Val}</span></div>
          </div>

          <div class="space-y-2 text-xs pt-2">
              <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">MASS SCALE CONVERSIONS</h3>
              <div class="flex justify-between bg-slate-50 p-2 rounded"><span>Metric Tons (MT)</span><span class="font-mono font-bold">${log.carbon_mt}</span></div>
              <div class="flex justify-between bg-slate-50 p-2 rounded"><span>Total Grams (g)</span><span class="font-mono font-bold">${Number(log.carbon_g).toLocaleString()}</span></div>
              <div class="flex justify-between bg-slate-50 p-2 rounded"><span>Pounds (lbs)</span><span class="font-mono font-bold">${log.carbon_lb}</span></div>
          </div>

          <p class="text-[8px] text-slate-400 italic text-justify pt-4 border-t">
              Disclaimer: This certificate verifies an environmental logistics calculation mapping to protocol emission indicators computed via the local API sandbox cluster layer.
          </p>

          <div class="pt-6 flex justify-between text-[9px] text-slate-400 font-bold uppercase">
              <div class="w-1/3 text-center border-t pt-1.5 text-emerald-700 italic font-serif normal-case">EcoRoute Verified</div>
              <div class="w-1/3 text-center border-t pt-1.5">AUDITOR SIGN-OFF</div>
          </div>
      </div>
  </body>
  </html>
  `;
}
