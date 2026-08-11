// /src/app/components/landing/HeroFeaturesGrid.jsx
'use client';

import React from 'react';
import AsymmetricMetrics from './AsymmetricMetrics';
import DeveloperApiMatrix from './DeveloperApiMatrix';

export default function HeroFeaturesGrid({ appMeta }) {
    return (
        <div className="w-full max-w-4xl space-y-16 text-left relative z-10 animate-fade-in-up">
            {/* SECTION 1: ASYMMETRIC METRICS SPLITS - markets the ZAR tax estimator module directly to corporations */}
            <AsymmetricMetrics appMeta={appMeta} />

            {/* SECTION 2: B2B DEVELOPER REST ENDPOINTS & VOLUMETRIC METRICS SLOTS */}
            <DeveloperApiMatrix appMeta={appMeta} />
        </div>
    );
}
