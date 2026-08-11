// /src/app/components/landing/HeroPreviewBox.jsx
'use client';

import React from 'react';

export default function HeroPreviewBox({ appMeta }) {
    // Graceful property fallbacks to protect against uninstantiated database columns
    const activeMonetizationType = appMeta?.monetization_type || 'Subscription';
    const activeFeeDisplay = appMeta?.monetization_fee_display || 'R280 / month';
    const activeLimitFree = appMeta?.usage_limit_free || 100;
    const activeLimitPremium = appMeta?.usage_limit_premium || 3000;

    return (
        /* FIXED WIDTH: Set to max-w-4xl to ensure it lines up symmetrically with the HeroFeaturesGrid underneath */
        <div className="w-full max-w-4xl mx-auto border border-slate-900 rounded-xl bg-slate-950/30 overflow-hidden flex flex-col md:flex-row shadow-2xl items-stretch transform hover:border-slate-800 transition-all duration-300 animate-fade-in-up stims-hover-glow relative z-10">

            {/* Left Side Visual Cover Card */}
            <div className="w-full md:w-5/12 bg-slate-950 relative min-h-[180px] flex flex-col justify-end p-4 text-left border-b md:border-b-0 md:border-r border-slate-900 overflow-hidden">
                <div
                    style={{ backgroundImage: "url('/EcoRoute.jpeg')" }}
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-lighten transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />

                <div className="relative z-10 space-y-0.5 font-mono">
                    <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase tracking-widest w-fit block">
                        {appMeta?.category || 'LOGISTICS'} SERVICE
                    </span>
                    <h2 className="text-sm font-black text-white tracking-wide uppercase">{appMeta?.title || 'EcoRoute'}</h2>
                    <p className="text-[9px] text-blue-400 italic font-sans">{appMeta?.tagline || 'Carbon Metrics Analysis Tool'}</p>
                </div>
            </div>

            {/* Right Side Product Monetization Summary Table Details */}
            <div className="w-full md:w-7/12 p-4 text-left flex flex-col justify-between space-y-3 bg-slate-950/50 font-mono text-[10px]">
                <div className="border-b border-slate-900 pb-1.5 flex justify-between items-center text-[8px] uppercase font-black text-slate-500 tracking-widest">
                    <span>SaaS Monetization & Licensing Parameters</span>
                    <span className="text-blue-400 font-bold">STIMS SECURE LINK</span>
                </div>

                <div className="divide-y divide-slate-900/60 font-mono text-[10px]">
                    <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Monetization Class:</span>
                        <span className="text-slate-200 font-bold uppercase">{activeMonetizationType}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Commercial Fee Amount:</span>
                        <span className="text-emerald-400 font-black tracking-wide">{activeFeeDisplay}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Compliance Audit Check:</span>
                        <span className="text-blue-400 uppercase font-bold">Cryptographic Ledger Verified</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-center text-[9px]">
                    <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Free Allowance</span>
                        <span className="text-white font-bold mt-0.5 block">{activeLimitFree.toLocaleString('en-ZA')} reqs/mo</span>
                    </div>
                    <div className="p-1.5 bg-slate-950 border border-slate-900 rounded">
                        <span className="text-blue-400 font-bold mt-0.5 block">{activeLimitPremium.toLocaleString('en-ZA')} reqs/mo</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
