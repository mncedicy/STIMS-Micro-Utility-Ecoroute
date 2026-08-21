// src\app\components\landing\LandingHero.jsx

'use client';

import React from 'react';
import HeroHeader from './HeroHeader';
import HeroPreviewBox from './HeroPreviewBox';
import HeroFeaturesGrid from './HeroFeaturesGrid';

export default function LandingHero({ onGetStartedClick, appData }) {
    const baseAppUrl = 'https://ecoroute.stims.co.za';

    const safeMeta = appData || {
        title: "EcoRoute",
        tagline: "Fleet Carbon Analytics Matrix",
        category: "LOGISTICS",
        description: "Automated mileage-to-emissions translation engine built specifically for independent local courier services seeking green compliance tax credits.",
        app_link: "#",
        monetization_type: "Subscription",
        monetization_fee_display: "R280 per month",
        usage_limit_free: 100,
        usage_limit_premium: 3000
    };

    // FIXED STRUCTURED SEO MARKETING SCHEMA: Injected dynamic JSON-LD block matching your exact B2B features matrix criteria
    const structuralSchemaMarkupJsonLd = {
        "@context": "https://ecoroute.stims.co.za",
        "@type": "SoftwareApplication",
        "name": safeMeta.title,
        "description": safeMeta.description,
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
            "Global Multi-Region Grid Emission Factors Registry Framework",
            "Real-Time Carbon Tax Liability Estimator",
            "B2B Programmatic REST API Token Channels Access"
        ]
    };

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-100 font-sans relative overflow-hidden flex flex-col items-center justify-start px-4 pt-6 pb-20 space-y-16 selection:bg-blue-500 selection:text-slate-950">
            {/* GOOGLE CRAWLER TUNNEL: Streams rich text metadata to help you appear first on Google Search rankings */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuralSchemaMarkupJsonLd) }}
            />

            {/* Decorative Ambient Spotlight Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content Layout Sections */}
            <HeroHeader onGetStartedClick={onGetStartedClick} appMeta={safeMeta} />
            <HeroPreviewBox appMeta={safeMeta} />
            <HeroFeaturesGrid appMeta={safeMeta} />
        </div>
    );
}
