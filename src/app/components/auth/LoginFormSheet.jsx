// src/app/components/auth/LoginFormSheet.jsx
'use client';

import React from 'react';

export default function LoginFormSheet({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    switchMode,
    loading
}) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                    Email Address *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@domain.com"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Password *
                    </label>
                    <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        disabled={loading}
                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wide cursor-pointer disabled:opacity-50"
                    >
                        Forgot Password?
                    </button>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>
        </div>
    );
}
