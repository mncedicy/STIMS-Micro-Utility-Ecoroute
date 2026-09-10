// src/app/legal/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import ReferralLegalSection from './ReferralLegalSection';

export default function LegalPolicyPage() {
    const currentYear = new Date().getFullYear();

    return (
        <main className="min-h-screen w-full bg-[#020617] text-slate-100 p-6 md:p-12 font-mono text-xs text-left selection:bg-blue-500 selection:text-slate-950">
            {/* Ambient Background Spotlight Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* FIXED WIDTH TUNING: Decreased maximum width from max-w-5xl to max-w-4xl for a balanced, compact reading layout */}
            <div className="w-full max-w-4xl mx-auto space-y-8 bg-slate-900/30 border border-slate-900 rounded-xl p-6 md:p-8 backdrop-blur-sm relative z-10 shadow-2xl stims-hover-glow">

                {/* Header Navigation Row */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                        <span className="text-[9px] font-mono tracking-widest text-blue-400 font-bold block mb-0.5">
                            EcoRoute System Rules
                        </span>
                        <h1 className="text-lg font-black text-white uppercase tracking-wide">
                            Terms of Service & Cancellation Policy
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-blue-400 border border-slate-800 rounded px-2.5 py-1 bg-slate-950/60 transition-colors cursor-pointer"
                    >
                        ◀ Return Home
                    </Link>
                </div>

                {/* Terms Body Text Containers */}
                <div className="space-y-6 font-sans text-slate-400 normal-case leading-relaxed text-[13px]">

                    {/* Section 1 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">1.0 Monthly Plan Fees</h4>
                        <p>
                            EcoRoute is a monthly subscription tool for tracking your carbon footprint. The Premium Pro plan costs a fixed rate of <strong>R280.00 ZAR per month</strong> and renews automatically.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">2.0 Cancellation Policy</h4>
                        <p>
                            You can cancel your Premium Pro subscription at any time. To do this, just go to your account settings page. You do not need to contact support to cancel your plan.
                        </p>
                        <p className="bg-slate-950/60 border border-slate-800/40 p-2.5 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans">
                            <strong className="text-slate-200">How long your plan stays active:</strong> After you cancel, your premium features (like your 3,000 monthly request tokens and Excel CSV batch tools) will stay fully working until the last day of your current paid billing month. After that day, your account will move down to the limited free plan, and you will not be charged again.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">3.0 Refund Rules</h4>
                        <p>
                            Because your pro features are added to your account instantly when you pay, <strong>EcoRoute does not give cash refunds or partial credits for early cancellations or unused monthly tokens</strong>.
                        </p>
                        <p>
                            All payments handled by our payment gateway (Paystack) are final. If you see a billing error or duplicate charge on your bank statement, please send us a message using the support tool at the bottom of your dashboard within 7 days.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">4.0 Data Rules After Moving to Free Plan</h4>
                        <p>
                            If your account moves down to the free plan, we will keep your saved vehicles history, carbon logs, and data records completely safe in our database for exactly <strong>90 days</strong>. This allows you to reactivate your plan later without losing any of your data history.
                        </p>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-1.5 font-mono text-xs">
                        <h4 className="text-white font-bold uppercase text-[11px] tracking-wide">5.0 General Disclaimer</h4>
                        <p>
                            All carbon footprint numbers, tax estimates, and electrical grid calculations given by this software are estimates. They are based on general greenhouse gas guidelines.
                        </p>
                        <p className="text-slate-400">
                            <strong className="text-slate-200">EcoRoute does not give official financial, legal, tax, or official auditing advice.</strong> You are entirely responsible for checking your final tax summaries with a certified public accountant or professional tax service (like SARS) before submitting official tax records. We are not responsible for any financial penalties, business problems, or data errors caused by incorrect file uploads or wrong vehicle setup information.
                        </p>
                    </div>

                    {/* Section 6: Modular Affiliate Rules Sub-Component */}
                    <ReferralLegalSection />

                </div>

                {/* Footer Copyright Signatures Strip */}
                <div className="flex justify-between items-center text-[9px] text-slate-600 border-t border-slate-900 pt-4 font-mono uppercase tracking-wider select-none">
                    <span>© {currentYear} STIMS EcoRoute. All rights reserved.</span>
                    <span>Version: 2026.3 // Secure</span>
                </div>

            </div>
        </main>
    );
}
