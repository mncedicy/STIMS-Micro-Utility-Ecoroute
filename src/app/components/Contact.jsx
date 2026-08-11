// /src/app/components/Contact.jsx
'use client';

import React, { useState, useTransition } from 'react';
import { dispatchTransmission } from '../actions/contact';
import ContactHeader from './contact/ContactHeader';
import ContactFields from './contact/ContactFields';

export default function Contact({ user, profile }) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState({ success: null, message: "" });

    const isLoggedIn = !!user;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ success: null, message: "" });

        const formData = new FormData(e.currentTarget);

        // Hydrate authenticated credentials transparently behind the scenes if logged in
        if (isLoggedIn) {
            const activeSessionName = profile?.first_name
                ? `${profile.first_name} ${profile.surname || ''}`.trim()
                : user?.email?.split('@')[0] || 'Authenticated Operator';

            formData.set("name", activeSessionName);
            formData.set("email", user?.email || "");
        }

        // Auto-assign the target sub-app identifier context parameter
        formData.set("tool", "EcoRoute");

        if (!formData.get("name") || !formData.get("email") || !formData.get("message")) {
            setStatus({ success: false, message: "Please fill out all required message parameters." });
            return;
        }

        startTransition(async () => {
            const result = await dispatchTransmission(formData);
            if (result.success) {
                setStatus({ success: true, message: result.message });
                const messageTextarea = e.target.querySelector('textarea[name="message"]');
                if (messageTextarea) messageTextarea.value = '';
            } else {
                setStatus({ success: false, message: result.error });
            }
        });
    };

    return (
        <section id="contact" className="w-full max-w-4xl mx-auto px-0 py-12 relative z-10 border-t border-slate-900 font-mono text-xs animate-fade-in">
            <ContactHeader />

            <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6 md:p-8 backdrop-blur-sm w-full mx-auto shadow-sm transition-all duration-300 ease-out stims-hover-glow">
                <form onSubmit={handleSubmit} className="space-y-5">

                    <ContactFields isLoggedIn={isLoggedIn} isPending={isPending} />

                    {/* Server Submission Status Prompt Notification Feedback Banner */}
                    {status.message && (
                        <div className={`p-3 rounded-lg text-xs font-mono border ${status.success
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                            }`}>
                            <div className="flex items-center space-x-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${status.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{status.message}</span>
                            </div>
                        </div>
                    )}

                    {/* Execution Submission Action Trigger Button */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all duration-200 shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2 stims-hover-glow transform hover:-translate-y-0.5"
                    >
                        {isPending ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Dispatching Ticket Parameters...</span>
                            </>
                        ) : (
                            <span>Transmit Support Request ➔</span>
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
}
