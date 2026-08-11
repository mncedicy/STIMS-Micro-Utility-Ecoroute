// /src/app/components/contact/ContactFields.jsx
'use client';

import React from 'react';

export default function ContactFields({ isLoggedIn, isPending }) {
    return (
        <div className="space-y-5">
            {/* 1. Identity Input Row (Only renders if visitor is logged out) */}
            {!isLoggedIn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            required={!isLoggedIn}
                            disabled={isPending}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="name@domain.co.za"
                            required={!isLoggedIn}
                            disabled={isPending}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                        />
                    </div>
                </div>
            ) : (
                /* Hidden input placeholders for logged-in sessions to satisfy action parameters constraints */
                <div className="hidden">
                    <input type="hidden" name="name" value="AUTH_USER" />
                    <input type="hidden" name="email" value="AUTH_EMAIL" />
                </div>
            )}

            {/* 2. Dynamic Topic Query Selector */}
            <div className="w-full">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
                    Select Support Topic Track
                </label>
                <select
                    name="queue"
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 cursor-pointer font-mono"
                >
                    <option value="Fleet Data Discrepancy">🇲🇿 Terrestrial Fleet Telemetry Mismatch</option>
                    <option value="API Bearer Authorization Fail">🔑 B2B Programmatic API Token Fault</option>
                    <option value="Paystack Billing & Subscription">💳 Pro Subscription & Checkout Query</option>
                    <option value="Emissions Factor Discrepancy">📊 GHG Factor Module Feedback</option>
                    <option value="Auditor PDF Exporter Failure">📄 Compliance PDF Exporter Layout Bug</option>
                    <option value="General Ecosystem Query">🌐 Other Stims Suite Platform Integration</option>
                </select>
            </div>

            {/* 3. Text Message Area Block */}
            <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Message Details</label>
                <textarea
                    name="message"
                    rows={4}
                    placeholder="Provide comprehensive transactional logs, environment hashes, or query details here..."
                    required
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none disabled:opacity-50 leading-relaxed font-sans normal-case"
                />
            </div>
        </div>
    );
}
