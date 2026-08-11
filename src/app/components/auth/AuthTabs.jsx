// /src/app/components/auth/AuthTabs.jsx
'use client';

import React from 'react';

export default function AuthTabs({ mode, setMode, clearMessage }) {
    const handleTabChange = (targetMode) => {
        setMode(targetMode);
        clearMessage();
    };

    return (
        <div className="grid grid-cols-2 gap-2 border-b border-slate-900/60 pb-4 mb-5 select-none">
            <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`py-2 text-center font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-[10px] ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-500 border border-slate-900/60 hover:text-slate-300'}`}
            >
                🔒 Sign In
            </button>
            <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`py-2 text-center font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-[10px] ${mode === 'signup' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-500 border border-slate-900/60 hover:text-slate-300'}`}
            >
                🔑 Create Account
            </button>
        </div>
    );
}
