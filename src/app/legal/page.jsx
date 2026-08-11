// /src/app/legal/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function LegalPolicyPage() {
    const currentYear = new Date().getFullYear();

    return (
        <main className="min-h-screen w-full bg-[#020617] text-slate-100 p-6 md:p-12 font-mono text-xs text-left selection:bg-blue-500 selection:text-slate-950">
            {/* Ambient Background Spotlight Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-3xl mx-auto space-y-8 bg-slate-900/30 border border-slate-900 rounded-xl p-6 md:p-8 backdrop-blur-sm relative z-10 shadow-2xl stims-hover-glow">

                {/* Header Navigation Row */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                        <span className="text-[9px] font-mono tracking-widest text-blue-400 font-bold block mb-0.5">
                            STIMS SOFTWARE SUITE LEGAL COMPLIANCE
                        </span>
                        <h1 className="text-lg font-black text-white uppercase tracking-wide">
                            Terms of Licensing & Cancellation Policy
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-blue-400 border border-slate-800 rounded px-2.5 py-1 bg-slate-950/60 transition-colors"
                    >
                        ◀ Return Home
                    </Link>
                </div>

                {/* Terms Body Text Containers */}
                <div className="space-y-6 font-sans text-slate-400 normal-case leading-relaxed text-[13px]">

                    {/* Section 1 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">1.0 Subscription Terms & Licensing Fees</h4>
                        <p>
                            EcoRoute provides commercial multi-modal carbon footprint analytics accounting software under a Software-as-a-Service (SaaS) operational architecture model. Premium Pro plan subscriptions are billed on a recurring monthly cycle at a fixed rate of <strong>R280.00 ZAR per month</strong>.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">2.0 Cancellation Policy</h4>
                        <p>
                            Registered corporate operators can cancel their Premium Pro subscription renewals at any time directly through their billing account settings page. No manual authorization or support ticket is required.
                        </p>
                        <p className="bg-slate-950/60 border border-slate-800/40 p-2.5 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans">
                            <strong>Note on Service Continuance:</strong> Upon requesting cancellation, your premium system access limits (up to 3,000 monthly request allocations and Excel batch CSV import log parsers) will remain fully active and viewable until the final day of your current paid billing period. At the end of the paid cycle, your account will automatically downgrade to the limited Free Sandbox tier without incurring further charges.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">3.0 Refund Policy Matrix</h4>
                        <p>
                            Because premium software limits are provisioned and loaded into your account instantly at payment confirmation, <strong>EcoRoute does not provide cash refunds, partial credits, or pro-rated balances for early cancellations or unused monthly request slots</strong>.
                        </p>
                        <p>
                            All card billing updates handled over the secure Paystack checkout gateway channels are final. If you believe an accounting error or duplicate card bill occurrence happened on your merchant statement, please submit a structural tracking flag directly through our integrated support ticket pipeline at the bottom of your dashboard workspace within 7 days.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">4.0 Data Retention Policy upon Downgrade</h4>
                        <p>
                            When an account transitions to the free sandbox tier, your logged fleet data history trails, customized vehicle assets registries, and calculation logs match signatures are securely preserved inside our encrypted database layers for exactly <strong>90 days</strong>. This lets you reactivate your subscription later without losing your records.
                        </p>
                    </div>

                    {/* FIXED SECTION 5: Explicitly added B2B Statutory Disclaimer */}
                    <div className="space-y-1.5 font-mono text-xs border-t border-slate-900 pt-4">
                        <h4 className="text-amber-400 font-bold uppercase text-[11px] tracking-wide">5.0 Statutory Legal Disclaimer</h4>
                        <p>
                            All carbon footprint assessments, global grid calculations, and tax exposure models provided by this software are estimates compiled based on the Greenhouse Gas Protocol guidelines and regional carbon taxing parameters.
                        </p>
                        <p className="text-slate-400">
                            <strong>EcoRoute does not provide official financial, legal, tax, or environmental auditing advice.</strong> Business entities are entirely responsible for verifying their final tax summaries with certified public accountants, legal professionals, or official revenue services (such as SARS) before submitting tax returns or regulatory compliance disclosures. We are not liable for any business disruptions, financial penalties, or logging errors resulting from inaccurate user spreadsheet uploads or telemetry data mismatches.
                        </p>
                    </div>

                </div>

                {/* Footer Copyright Signatures Strip */}
                <div className="flex justify-between items-center text-[9px] text-slate-600 border-t border-slate-900 pt-4 font-mono uppercase tracking-wider select-none">
                    <span>© {currentYear} STIMS EcoRoute Core. All rights reserved.</span>
                    <span>Document Version: 2026.2 // Verified Secure</span>
                </div>

            </div>
        </main>
    );
}
