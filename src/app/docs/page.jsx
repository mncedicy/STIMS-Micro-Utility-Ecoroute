// src/app/docs/page.jsx

import React from 'react';
import DocsClientView from './DocsClientView';

// Centralized Server Metadata strictly aligned with the Stims EcoRoute API architecture
export const metadata = {
    title: "EcoRoute REST API Engine Documentation | Stims Logistics",
    description: "Developer reference for the EcoRoute REST API. Integrate real-time single-item audit calculators, multi-modal batch ingestion engines, route checking simulators, SARS carbon tax ledger tools, and static data lookup catalogs.",
    keywords: [
        "carbon accounting API", "greenhouse gas protocol", "scope 1 2 3 emissions", "carbon tax calculator",
        "logistics telemetry", "Stims", "EcoRoute", "carbon footprint", "fleet emissions audit",
        "sustainability reporting", "environmental compliance", "supply chain emissions",
        "carbon tracking software", "eco-friendly logistics", "carbon footprint calculator",
        "carbon emissions tracking", "sustainability analytics", "carbon management platform",
        "green logistics solutions", "carbon reduction strategies", "South Africa carbon tax compliance",
        "carbon tax calculator South Africa", "API documentation", "audit calculator endpoint",
        "bulk log API", "batch injection emissions", "route check API", "SARS tax compliance ledger",
        "airport directory lookup", "B2B emissions auditing", "Stims Logistics telemetry"
    ],
    metadataBase: new URL("https://ecoroute.stims.co.za"),
    alternates: {
        canonical: "/docs",
    },
    openGraph: {
        title: "EcoRoute REST API Engine Documentation | Stims Logistics",
        description: "Comprehensive reference manual for developers integrating EcoRoute fleet emissions audits, multi-modal batch calculations, sequential route checking, and SARS-compliant carbon tax ledger tracking.",
        url: "https://ecoroute.stims.co.za",
        siteName: "EcoRoute Stims",
        type: "website",
    },
};

export default function DocsPage() {
    return <DocsClientView />;
}
