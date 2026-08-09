// /src/app/components/ApiPayloads.jsx
'use client';

import React from 'react';

export default function ApiPayloads() {
    return (
        <div className="space-y-3 font-mono text-[10px]">
            <span className="text-slate-300 font-bold uppercase block text-[11px] border-b border-slate-900 pb-1">REQUEST PAYLOAD JSON SCHEMAS</span>

            <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase block">1. Land Vehicles</span>
                <pre className="bg-slate-950/60 p-2 border border-slate-900 rounded text-blue-400 overflow-x-auto">
                    {`{\n  "type": "vehicle",\n  "vehicle_id": "YOUR_UUID",\n  "distance": 124.5,\n  "unit": "km",\n  "emission_date": "2026-08-01",\n  "save_log": true\n}`}
                </pre>
            </div>

            <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase block">2. Aviation Flights</span>
                <pre className="bg-slate-950/60 p-2 border border-slate-900 rounded text-blue-400 overflow-x-auto">
                    {`{\n  "type": "flight",\n  "origin_identifier": "31055",\n  "dest_identifier": "2775",\n  "passengers": 7,\n  "emission_date": "2026-08-05",\n  "save_log": true\n}`}
                </pre>
            </div>

            <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase block">3. Cargo Freight Shipping</span>
                <pre className="bg-slate-950/60 p-2 border border-slate-900 rounded text-blue-400 overflow-x-auto">
                    {`{\n  "type": "shipping",\n  "cargo_weight": 18500.0,\n  "mass_unit": "kg",\n  "distance": 840.2,\n  "unit": "km",\n  "emission_date": "2026-08-06",\n  "save_log": true\n}`}
                </pre>
            </div>

            <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase block">4. Grid Power Electricity</span>
                <pre className="bg-slate-950/60 p-2 border border-slate-900 rounded text-blue-400 overflow-x-auto">
                    {`{\n  "type": "electricity",\n  "energy_kwh": 4500.75,\n  "country_code": "ZA",\n  "emission_date": "2026-08-07",\n  "save_log": true\n}`}
                </pre>
            </div>

            <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase block">5. Gas Fuel Combustion</span>
                <pre className="bg-slate-950/60 p-2 border border-slate-900 rounded text-blue-400 overflow-x-auto">
                    {`{\n  "type": "gas",\n  "gas_quantity": 120.0,\n  "gas_type": "LPG",\n  "gas_unit": "kg",\n  "emission_date": "2026-08-08",\n  "save_log": true\n}`}
                </pre>
            </div>
        </div>
    );
}
