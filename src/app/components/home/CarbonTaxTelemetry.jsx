// src/app/components/home/CarbonTaxTelemetry.jsx

'use client';

import React from 'react';

export default function CarbonTaxTelemetry({ tokenRecord, appMeta }) {
    // Read the saved total tax cost from your database records
    const totalAccruedTaxValue = parseFloat(tokenRecord?.total_accrued_tax_liability_zar || 0.00);

    // Read general setup settings from your active app configuration
    const baseTaxRate = parseFloat(appMeta?.carbon_tax_rate_zar_per_tonne || 190.00);
    const exemptAllowancePercent = parseFloat(appMeta?.carbon_tax_free_allowance_percentage || 60.00);

    return (
        <div className="w-full bg-slate-950/40 border border-slate-900 rounded-xl p-5 font-mono text-xs space-y-4 animate-fade-in text-left stims-hover-glow">

            {/* Header section explaining the carbon tax rules */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                <div>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                        📊 Carbon Tax Estimator
                    </span>
                    <span className="text-slate-500 block text-[9px] mt-0.5 font-sans normal-case leading-normal">
                        This card calculates a live estimate of your carbon tax costs. It adjusts automatically to your local laws and carbon pricing rules.
                    </span>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-black text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-1 rounded tracking-wider block w-fit ml-auto select-none">
                        System Active
                    </span>
                </div>
            </div>

            {/* Financial Estimates Data Display Row Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* 1. Total Accumulated Tax Bill */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Estimated Tax Cost</span>
                    <div className="text-lg font-black text-white tracking-tight">
                        {totalAccruedTaxValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-500 font-normal">ZAR</span>
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">Total tax money owed during this tracking cycle</span>
                </div>

                {/* 2. Base Rate Index */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Local Carbon Price</span>
                    <div className="text-lg font-black text-slate-200 tracking-tight">
                        R {baseTaxRate.toFixed(2)} <span className="text-[9px] text-slate-500 font-normal">/ Ton</span>
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">Standard cost charged per ton of carbon pollution</span>
                </div>

                {/* 3. Exempt Credit Discount Percentage */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-lg space-y-1">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Tax-Free Allowance</span>
                    <div className="text-lg font-black text-blue-400 tracking-tight">
                        {exemptAllowancePercent.toFixed(1)} %
                    </div>
                    <span className="text-slate-600 block text-[8px] font-sans normal-case">The discount percentage given before tax penalties apply</span>
                </div>

            </div>

            {/* Simple explanation outlining regional grid factor logic */}
            <div className="bg-slate-950/30 p-2.5 rounded border border-slate-900/60 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-sans normal-case leading-relaxed">
                <div className="flex items-center space-x-1.5">
                    <span className="h-1 w-1 bg-emerald-400 rounded-full" />
                    <p>
                        <strong>Location Note:</strong> Calculations change automatically based on your country. The system uses your specific electricity grid information (from heavy coal power networks to clean water power networks) to make sure your tax estimates stay completely correct.
                    </p>
                </div>
                <span className="text-slate-600 text-[8px] tracking-wider font-mono font-bold uppercase shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 select-none">
                    Multi-Region Support
                </span>
            </div>
        </div>
    );
}
