// src/app/components/home/ledger/details/UtilityAuditDetails.jsx
'use client';

import React from 'react';

export default function UtilityAuditDetails({ category, log, meta }) {
    if (category === 'electricity' || category === 'ELECTRICITY') {
        const selectedSource = meta?.powerSourceApplied || log?.shipping_mode || 'utility_grid';

        // Compact single-line strings mapping
        let shortMethod = 'Grid Audit Factor';
        if (meta?.calculationMethod?.includes('GENERATOR')) shortMethod = 'Scope 1 Generator';
        if (meta?.calculationMethod?.includes('SOLAR')) shortMethod = 'Solar PV Off-Grid';

        return (
            <div className="space-y-1.5 animate-fade-in font-mono text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Power Consumed:</span>
                    <span className="text-white font-bold">{log.energy_kwh || meta.inputKwh || 0} kWh</span>
                </div>

                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Supply Source:</span>
                    <span className="text-blue-400 font-bold uppercase">
                        {selectedSource.replace('_', ' ')}
                    </span>
                </div>

                {/* Dynamically hidden when choosing localized alternative machinery configurations */}
                {selectedSource === 'utility_grid' && (
                    <div className="flex justify-between border-b border-slate-900 pb-1 animate-fade-in">
                        <span>Grid Region:</span>
                        <span className="text-amber-400 font-bold uppercase">
                            {log.country_code || meta.countryTarget || 'ZA'}
                        </span>
                    </div>
                )}

                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Intensity Coefficient:</span>
                    <span className="text-slate-300 font-bold">
                        {meta.gridFactorApplied || log.raw_payload?.metadata?.gridFactorApplied || 0.942} kg CO₂/kWh
                    </span>
                </div>

                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Methodology:</span>
                    <span className="text-slate-400 font-sans text-[11px] normal-case">{shortMethod}</span>
                </div>
            </div>
        );
    }

    if (category === 'gas' || category === 'GAS') {
        const gasTypeLabel = log.gas_type || meta.gasClassification || 'NATURAL_GAS';
        const displayUnit = log.gas_unit || meta.gasUnitApplied || 'm3';
        const displayFactor = meta.combustionFactorApplied || log.raw_payload?.metadata?.combustionFactorApplied || 2.02;

        return (
            <div className="space-y-1.5 animate-fade-in font-mono text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Combustion Fuel:</span>
                    <span className="text-white font-bold">
                        {log.gas_quantity || meta.inputQuantity || 0} {displayUnit}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Gas Profile Type:</span>
                    <span className="text-blue-400 font-bold uppercase">
                        {gasTypeLabel.replace('_', ' ')}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Combustion Intensity:</span>
                    <span className="text-slate-300 font-bold">{displayFactor} kg/unit</span>
                </div>
            </div>
        );
    }

    return null;
}
