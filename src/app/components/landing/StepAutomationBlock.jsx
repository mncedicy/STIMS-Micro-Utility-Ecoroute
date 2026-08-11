// /src/app/components/landing/StepAutomationBlock.jsx
'use client';

import React from 'react';

export default function StepAutomationBlock() {
    return (
        <div className="w-full p-6 md:p-8 bg-[#07162c]/60 border border-[#0d233e] rounded-2xl space-y-8 flex flex-col md:flex-row md:items-center justify-between gap-8 transform hover:border-blue-900/40 transition-colors duration-300 relative overflow-hidden shadow-2xl animate-fade-in-up">
            {/* Left Side: Call-To-Action Header Typography */}
            <div className="flex-1 space-y-2 text-left">
                <span className="text-blue-400 font-bold uppercase text-[9px] tracking-widest block font-mono">SYSTEM STEP WORKER</span>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase leading-tight tracking-wide font-mono">
                    MAXIMIZE LOGISTICAL AUDITING WITH AN AUTOMATED PROTOCOL THAT CALCULATES INSTANTLY.
                </h3>
                <p className="text-[11px] text-slate-400 font-sans normal-case leading-relaxed max-w-md pt-1">
                    Get your green audit ledger active in under 3 minutes. Our step system connects your account seamlessly without requiring manual configuration.
                </p>
            </div>

            {/* Right Side: Triple Numeric Sequence Progress Blocks */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch text-[10px] font-mono">
                {/* Step 1 */}
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-800 transition-colors duration-200">
                    <span className="text-slate-600 font-black text-2xl block tracking-tighter leading-none select-none">1</span>
                    <div className="space-y-1">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider">Initialize Profile</h5>
                        <p className="text-[10px] font-sans text-slate-500 normal-case leading-normal">Sign up to your dashboard and complete your identity ledger validation.</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-800 transition-colors duration-200">
                    <span className="text-slate-600 font-black text-2xl block tracking-tighter leading-none select-none">2</span>
                    <div className="space-y-1">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider">Intercept Runs</h5>
                        <p className="text-[10px] font-sans text-slate-500 normal-case leading-normal">Submit odometer metrics or execute a REST post payload through the API.</p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-800 transition-colors duration-200">
                    <span className="text-blue-400 font-black text-2xl block tracking-tighter leading-none select-none">3</span>
                    <div className="space-y-1">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider text-blue-400">Export Ledger</h5>
                        <p className="text-[10px] font-sans text-slate-500 normal-case leading-normal">Download a signed white auditor PDF containing your emissions mix shares.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
