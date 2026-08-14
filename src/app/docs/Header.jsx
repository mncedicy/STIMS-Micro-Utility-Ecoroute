// src/app/docs/Header.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 z-50 flex items-center justify-between px-6 select-none">
            <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-widest text-slate-200">EcoRoute Core Engine Docs</span>
            </div>
            <Link
                href="/"
                className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-blue-400 border border-slate-800 rounded px-2.5 py-1 bg-slate-900/60 transition-colors"
            >
                ◀ Return Home
            </Link>
        </header>
    );
}
