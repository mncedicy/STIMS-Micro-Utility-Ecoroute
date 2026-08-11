// /src/app/components/LandingHero.jsx
'use client';

import React from 'react';
import HeroFeaturesGrid from './landing/HeroFeaturesGrid';

export default function LandingHero({ onGetStartedClick, appData }) {
    const baseAppUrl = 'https://ecoroute.stims.co.za';

    // FIXED RICH TEXT SCHEMA: Injected dynamic JSON-LD block matching your exact application features matrix criteria 
    const structuralSchemaMarkupJsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": appData?.title || "EcoRoute",
        "description": appData?.description || "Automated multi-modal logistics mileage-to-carbon accounting software engine.",
        "url": baseAppUrl,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "author": {
            "@type": "Organization",
            "name": "STIMS Software Suite",
            "url": "https://ecoroute.stims.co.za"
        },
        "offers": {
            "@type": "Offer",
            "price": "280.00",
            "priceCurrency": "ZAR",
            "category": "Subscription"
        },
        "featureList": [
            "Terrestrial Fleet Telemetry Mismatch Calculations",
            "GHG Protocol Scope 1-2-3 Compliance Boundaries Segregation",
            "Excel Batch CSV Ingestion Spreadsheet Imports Log Parsers",
            "Real-Time ZAR Government Carbon Tax Liability Estimator",
            "B2B Programmatic REST API Token Channels Access"
        ]
    };

    return (
        <section className="w-full flex flex-col items-center justify-start pt-20 pb-16 px-4 relative z-10">
            {/* GOOGLE CRAWLER SYNC: Renders dynamic JSON-LD rich snippet down directly to spiders during text parses hooks */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuralSchemaMarkupJsonLd) }}
            />

            <div className="w-full max-w-4xl space-y-12 text-center">

                {/* Core Product Text Blocks Section */}
                <div className="space-y-4 max-w-2xl mx-auto select-none">
                    <div className="inline-flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1 animate-fade-in">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                            STIMS LOGISTICS SUITE V2.0 // ACTIVE NODE
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none font-mono">
                        {appData?.title || 'ECOROUTE'}
                    </h1>

                    <h2 className="text-blue-500 font-mono tracking-widest font-black text-xs uppercase">
                        {appData?.tagline || 'FLEET CARBON ANALYTICS MATRIX'}
                    </h2>

                    <p className="text-slate-400 font-sans normal-case text-sm md:text-base leading-relaxed pt-2">
                        {appData?.description || 'Automated mileage-to-emissions translation engine built specifically for independent local courier services seeking compliance environmental tax credits.'}
                    </p>
                </div>

                {/* Big Launch Interactive CTA Action Trigger Button */}
                <div className="flex justify-center select-none pt-2">
                    <button
                        type="button"
                        onClick={onGetStartedClick}
                        className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-wider text-xs font-bold rounded-lg transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer shadow-md shadow-blue-500/10 stims-hover-glow flex items-center space-x-2"
                    >
                        <span>Initialize Dashboard Core Console</span>
                        <span className="text-xs">➔</span>
                    </button>
                </div>

                {/* Upper Visual Asset Separation Rule line */}
                <div className="w-full border-t border-slate-900 pt-12 text-left">
                    {/* Renders structural features cards matrices blocks underneath */}
                    <HeroFeaturesGrid appMeta={appData} />
                </div>

            </div>
        </section>
    );
}
