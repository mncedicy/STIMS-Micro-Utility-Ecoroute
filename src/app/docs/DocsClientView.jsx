// src/app/docs/DocsClientView.jsx
'use client';

import React, { useState } from 'react';
import CoreGuidesSection from './CoreGuidesSection';
import EndpointsSection from './EndpointsSection';
import Sidebar from './Sidebar';
import Link from 'next/link';

export default function DocsClientView() {
    const [activeSection, setActiveSection] = useState('introduction');

    const scrollToViewSection = (elementId) => {
        setActiveSection(elementId);
        const node = document.getElementById(elementId);
        if (node) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-mono flex flex-col">
            <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 z-50 flex items-center justify-between px-6">
                <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-widest text-slate-200">EcoRoute Core Engine Docs</span>
                </div>
                <Link
                    href="/"
                    className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-blue-400 border border-slate-800 rounded px-2.5 py-1 bg-slate-900/60 transition-colors"
                >
                    ◀ Return Home
                </Link>
            </header>

            <div className="flex flex-1 pt-14 w-full max-w-[1550px] mx-auto relative items-start">
                <Sidebar activeSection={activeSection} onSectionClick={scrollToViewSection} />

                <main className="flex-1 p-6 lg:p-10 overflow-y-auto space-y-20 text-left max-w-full">
                    <CoreGuidesSection />
                    <EndpointsSection />
                </main>
            </div>
        </div>
    );
}
