// src/app/privacy/page.jsx
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

            {/* FIXED WIDTH TUNING: Adjusted maximum width to max-w-4xl to create a balanced, highly scannable reading layout */}
            <div className="w-full max-w-4xl mx-auto space-y-8 bg-slate-900/30 border border-slate-900 rounded-xl p-6 md:p-8 backdrop-blur-sm relative z-10 shadow-2xl stims-hover-glow">

                {/* Header Section */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                        <span className="text-[9px] font-mono tracking-widest text-blue-400 font-bold block mb-0.5">
                            EcoRoute Data Protection
                        </span>
                        <h1 className="text-lg font-black text-white uppercase tracking-wide">
                            Privacy Policy & Data Security
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
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">1.0 What Data We Collect</h4>
                        <p>
                            EcoRoute only saves information that is strictly needed to calculate your carbon footprint. We follow simple data rules to ensure we only save what is necessary:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-1 text-[11px] text-slate-400 font-sans">
                            <li><strong>Your Profile Details:</strong> Your name, email address, company name, and country code filled in at signup.</li>
                            <li><strong>Your Carbon Data:</strong> Vehicle distance driven, flight history paths, shipping weight logs, and electricity or gas usage numbers.</li>
                            <li><strong>Your Billing Info:</strong> Secure, anonymous payment tokens used by Paystack. We do not store or see your raw credit card numbers.</li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">2.0 Privacy Law Compliance (POPIA & GDPR)</h4>
                        <p>
                            Our platform security keeps your information safe and follows both local and international privacy laws:
                        </p>
                        <p className="font-sans normal-case text-[12px] leading-relaxed">
                            • <strong>POPIA Rules:</strong> We follow the South African Protection of Personal Information Act. We act responsibly to secure your profile details and trip records.
                            <br />
                            • <strong>GDPR Rules:</strong> For operations in Europe, we calculate your pollution scores safely without saving any unnecessary personal details.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">3.0 Keeping Your Data Safe (The 90-Day Rule)</h4>
                        <p>
                            We only keep your carbon records active while you have a working subscription. If you cancel your plan, the following safety rule applies:
                        </p>
                        <p className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans">
                            <strong>The 90-Day Hold:</strong> When you cancel your subscription, we keep your past carbon logs, vehicle lists, and history records safe and ready for exactly <strong>90 days</strong>. If you do not reactivate your paid plan within 90 days, our system will automatically hide your rows and delete them permanently from our active database.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">4.0 No Data Sharing Policy</h4>
                        <p>
                            EcoRoute does not share, rent, or sell your company information, trip history, or personal profile details to advertising companies or data brokers.
                        </p>
                        <p>
                            All software code connections made through our API system are protected by secure, private keys. You can change or replace these secret keys instantly from your dashboard if you suspect a security issue.
                        </p>
                    </div>

                </div>

                {/* Footer Strip */}
                <div className="flex justify-between items-center text-[9px] text-slate-600 border-t border-slate-900 pt-4 font-mono uppercase tracking-wider select-none">
                    <span>© {currentYear} STIMS EcoRoute. All rights reserved.</span>
                    <span>Version: Privacy-2026.1 // POPIA / GDPR Compliant</span>
                </div>

            </div>
        </main>
    );
}
