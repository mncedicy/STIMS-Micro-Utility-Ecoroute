// /src/app/privacy/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    const currentYear = new Date().getFullYear();

    return (
        <main className="min-h-screen w-full bg-[#020617] text-slate-100 p-6 md:p-12 font-mono text-xs text-left selection:bg-blue-500 selection:text-slate-950">
            {/* Ambient Background Spotlight Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-3xl mx-auto space-y-8 bg-slate-900/30 border border-slate-900 rounded-xl p-6 md:p-8 backdrop-blur-sm relative z-10 shadow-2xl stims-hover-glow">

                {/* Header Section */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                        <span className="text-[9px] font-mono tracking-widest text-blue-400 font-bold block mb-0.5">
                            STIMS SOFTWARE SUITE DATA PROTECTION
                        </span>
                        <h1 className="text-lg font-black text-white uppercase tracking-wide">
                            Privacy Policy & Data Security Schema
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-blue-400 border border-slate-800 rounded px-2.5 py-1 bg-slate-950/60 transition-colors"
                    >
                        ◀ Return Home
                    </Link>
                </div>

                {/* Privacy Terms Content Panels */}
                <div className="space-y-6 font-sans text-slate-400 normal-case leading-relaxed text-[13px]">

                    {/* Section 1 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">1.0 Data Collection Boundaries & Scope</h4>
                        <p>
                            EcoRoute processes telemetry, logistical, and organizational information strictly required to compute Greenhouse Gas (GHG) Protocol emissions balances. We apply data minimization principles to ensure only critical parameters are stored:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-1 text-[11px] text-slate-400 font-sans">
                            <li><strong>Identity Infrastructure:</strong> First name, surname, email address, company name, and 2-character country code (ISO parameters) registered at signup.</li>
                            <li><strong>Telemetry Logs Parameters:</strong> Terrestrial vehicle mileage, flight sector records (IATA airport codes), shipping cargo weights, utility kilowatt-hours (kWh), and stationary fuel values.</li>
                            <li><strong>Billing Meta-Tokens:</strong> Gateway customer codes and single-use webhook tracking event keys handled natively over encrypted Paystack channels. We do not store raw credit card numbers.</li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">2.0 Multi-Jurisdiction Legal Compliance (POPIA / GDPR)</h4>
                        <p>
                            Our data protection architecture operates securely across international administrative regulatory frameworks:
                        </p>
                        <p className="font-sans normal-case text-[12px]">
                            • <strong>POPIA Compliance:</strong> In accordance with the Protection of Personal Information Act of South Africa, we act as the responsible party securing all corporate profile information and operational logs.
                            <br />
                            • <strong>GDPR Compliance:</strong> For European operations, calculations matching international IEA, DEFRA, and Ember Climate matrices handle telemetry inputs without compiling unnecessary personally identifiable information (PII).
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">3.0 Data Retention & Automatic 90-Day Archiving Rule</h4>
                        <p>
                            We preserve your active corporate auditing logs exclusively while your licensing terms remain valid. To protect company boundaries upon subscription termination, the following lifecycle rule triggers automatically:
                        </p>
                        <p className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans">
                            <strong>The 90-Day Grace Window:</strong> When a user subscription status transitions to <code className="text-rose-400 font-mono text-[10px]">cancelled</code>, all historical emissions logs, custom vehicle registries, and API consumption traces are kept fully available and active for exactly <strong>90 days</strong>. If the user does not reactivate their premium plan within this window, an automated background scheduler moves the rows to a disconnected database archive table and permanently purges active instances.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">4.0 Information Sharing & B2B Cryptographic Safety</h4>
                        <p>
                            EcoRoute does not share, rent, trade, or sell historical environmental logs, delivery manifests, or corporate identity metadata to third-party advertising networks or external data brokers.
                        </p>
                        <p>
                            Programmatic interactions over our public REST channels are secured via isolated <strong>Bearer Token Signatures</strong> (`ecoroute_live_...`). These tokens are under the direct control of the organization administrator and can be rotated instantly from the API management console if an environment compromise is detected.
                        </p>
                    </div>

                </div>

                {/* Footer Strip */}
                <div className="flex justify-between items-center text-[9px] text-slate-600 border-t border-slate-900 pt-4 font-mono uppercase tracking-wider select-none">
                    <span>© {currentYear} STIMS EcoRoute Core. All rights reserved.</span>
                    <span>Document Version: Privacy-2026.1 // POPIA / GDPR Certified</span>
                </div>

            </div>
        </main>
    );
}
