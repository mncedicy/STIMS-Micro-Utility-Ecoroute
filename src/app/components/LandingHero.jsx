// /src/app/components/LandingHero.jsx
'use client';

import React from 'react';
import HeroHeader from './landing/HeroHeader';
import HeroPreviewBox from './landing/HeroPreviewBox';
import HeroFeaturesGrid from './landing/HeroFeaturesGrid';

export default function LandingHero({ onGetStartedClick, appData }) {
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

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-100 font-sans relative overflow-hidden flex flex-col items-center justify-start px-4 pt-6 pb-20 space-y-16 selection:bg-blue-500 selection:text-slate-950">
            {/* Decorative Glow Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content Layout Sections */}
            <HeroHeader onGetStartedClick={onGetStartedClick} appMeta={safeMeta} />
            <HeroPreviewBox appMeta={safeMeta} />
            <HeroFeaturesGrid appMeta={safeMeta} />
        </div>
    );
}
