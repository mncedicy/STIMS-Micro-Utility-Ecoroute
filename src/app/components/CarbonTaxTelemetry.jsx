// /src/app/components/CarbonTaxTelemetry.jsx
'use client';

import React from 'react';

export default function CarbonTaxTelemetry({ tokenRecord, appMeta }) {
    // Read the saved total accrued cost from your database records
    const totalAccruedTaxValue = parseFloat(tokenRecord?.total_accrued_tax_liability_zar || 0.00);

    // Read global configuration metrics from your active app setup registry
    const baseTaxRate = parseFloat(appMeta?.carbon_tax_rate_zar_per_tonne || 190.00);
    const exemptAllowancePercent = parseFloat(appMeta?.carbon_tax_free_allowance_percentage || 60.00);

    return (
        <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-5 font-mono text-xs space-y-4 animate-fade-in text-left stims-hover-glow">

            {/* Header section explaining the international tax frameworks */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                <div>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                        🌐 GLOBAL CARBON TAX LIABILITY FORECASTER
                    </span>
                    <span className="text-slate-500 block text-[9px] mt-0.5 font-sans normal-case leading-normal">
                        This section calculates a live estimation of financial carbon liabilities, adapting to regional carbon pricing, cross-border adjustment mechanisms (CBAM), and state climate tax acts.
                    </span>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-black text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-1 rounded tracking-wider block w-fit ml-auto select-none">
                        GLOBAL COMPLIANCE ACTIVE
                    </span>
                </div>
            </div>

            {/* Financial Estimates Data Display Row Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* 1. Total Accumulated Monetary Cost Owed */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">ACCUMULATED LIABILITY</span>
                    <div className="text-lg font-black text-white tracking-tight">
                        {totalAccruedTaxValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-normal">UNITS</span>
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">Total localized tax exposure accumulated this cycle</span>
                </div>

                {/* 2. Global Base Rate Index */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">REGIONAL CARBON PRICE</span>
                    <div className="text-lg font-black text-slate-200 tracking-tight">
                        {baseTaxRate.toFixed(2)} <span className="text-[9px] text-slate-500 font-normal">/ Tonne CO2e</span>
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">Baseline state tax pricing variable per carbon tonne</span>
                </div>

                {/* 3. Exempt Credit Discount Percentage */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">BASIC EXEMPT ALLOWANCE</span>
                    <div className="text-lg font-black text-blue-400 tracking-tight">
                        {exemptAllowancePercent.toFixed(1)} %
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">The standard discount rate granted before tax penalties apply</span>
                </div>

            </div>

            {/* Universal English explanation outlining regional grid factor logic */}
            <div className="bg-slate-950/30 p-2.5 rounded border border-slate-900/60 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-sans normal-case leading-relaxed">
                <div className="flex items-center space-x-1.5">
                    <span className="h-1 w-1 bg-emerald-400 rounded-full" />
                    <p>
                        <strong>Global Validation Rule:</strong> Calculations auto-adjust to your region. When auditing utility load profiles, the engine applies the specific Scope 2 Grid Emission Factor (from coal-dominated networks like Poland or South Africa to hydro-clean grids like Norway) to generate accurate, verifiable tax logs.
                    </p>
                </div>
                <span className="text-slate-600 text-[8px] tracking-wider font-mono font-bold uppercase shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 select-none">
                    MULTI-REGION FACTOR ENGINE
                </span>
            </div>
        </div>
    );
}
