'use client';

import React from 'react';

export default function Footer({ onNavigateViewPage }) {

    const handleGoHomeRoute = (e) => {
        e.preventDefault();
        // Safely verify if navigation controller prop exists before executing state shift
        if (typeof onNavigateViewPage === 'function') {
            onNavigateViewPage('dashboard');
        }
    };

    return (
        <footer className="w-full border-t border-slate-900 bg-slate-950/40 py-6 mt-auto relative z-10 font-mono text-[11px] text-slate-500">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">

                <div>
                    <span>© {new Date().getFullYear()} STIMS EcoRoute. All rights reserved.</span>
                </div>

                <div className="flex items-center space-x-4">
                    {/* MODIFIED: Embedded your request with bound state changer handler actions to prevent page refreshes */}
                    <a
                        href="https://ecoroute.stims.co.za"
                        onClick={handleGoHomeRoute}
                        className="text-blue-500/80 hover:underline cursor-pointer"
                    >
                        ecoroute.stims.co.za
                    </a>
                </div>

            </div>
        </footer>
    );
}
