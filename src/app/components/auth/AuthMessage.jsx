'use client';

import React from 'react';

export default function AuthMessage({ message }) {
    if (!message?.text) return null;

    return (
        <div
            aria-live="polite"
            className={`p-3 rounded-lg text-[11px] border leading-normal font-mono ${message.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                }`}
        >
            <div className="flex items-center space-x-2">
                <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${message.success ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                />
                <span className="normal-case">{message.text}</span>
            </div>
        </div>
    );
}