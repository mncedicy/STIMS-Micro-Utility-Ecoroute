// /src/app/components/contact/ContactHeader.jsx
'use client';

import React from 'react';

export default function ContactHeader() {
    return (
        <div className="text-center mb-8 select-none">
            <span className="text-[9px] font-mono tracking-widest text-blue-500 uppercase font-bold">
                SYSTEM ENQUIRY SERVICE PIPELINE
            </span>
            <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-1 leading-tight font-sans">
                Submit a real-time tracking support ticket down to our engineering core queues.
            </p>
        </div>
    );
}
