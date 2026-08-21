// src/app/components/home/ledger/details/UtilityAuditDetails.jsx

'use client';

import React from 'react';

export default function UtilityAuditDetails({ category, log, meta }) {
    if (category === 'electricity' && (log.energy_kwh || meta.inputKwh)) {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Grid Electricity:</span>
                    <span className="text-white font-bold">{log.energy_kwh || meta.inputKwh} kWh</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Utility Grid Region:</span>
                    <span className="text-amber-400 font-bold uppercase">
                        {log.country_code || meta.countryTarget || 'ZA'}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Grid Intensity Factor:</span>
                    <span className="text-slate-400">{meta.gridFactorApplied || '0.94'} kg/kWh</span>
                </div>
            </div>
        );
    }

    if (category === 'gas' && (log.gas_quantity || meta.inputQuantity)) {
        return (
            <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Combustion Fuel:</span>
                    <span className="text-white font-bold">
                        {log.gas_quantity || meta.inputQuantity} {log.gas_unit || meta.gasUnit || 'm3'}
                    </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span>Gas Profile Type:</span>
                    <span className="text-slate-300 font-bold uppercase">
                        {(log.gas_type || meta.gasClassification || 'NATURAL_GAS').replace('_', ' ')}
                    </span>
                </div>
                {meta.combustionFactorApplied && (
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span>Combustion Intensity:</span>
                        <span className="text-slate-400">{meta.combustionFactorApplied} kg/unit</span>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
