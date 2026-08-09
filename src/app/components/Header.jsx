// /src/app/components/Header.jsx
'use client';

import React from 'react';

export default function Header({ user, profile, isPremium, quotaReached, currentUsage = 0, limitCap = 100 }) {
    // Takes the first string block of the email, preventing the array crash
    const userNameString = profile?.first_name
        ? `${profile.first_name} ${profile.surname || ''}`
        : user?.email?.split('@')[0] || 'User';

    // FIXED MATH: Dynamically calculate request balance limits remaining in the current billing cycle anniversary period
    const remainingQuota = Math.max(0, limitCap - currentUsage);

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl transition-all duration-300 stims-hover-glow relative overflow-hidden font-mono text-xs w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">ACTIVE LOGIN SESSION</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                        WELCOME BACK, {userNameString.trim()}
                    </h2>
                    {profile?.company && (
                        <span className="text-[10px] text-slate-400 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded block w-fit">
                            {profile.company.toUpperCase()}
                        </span>
                    )}
                </div>

                {/* FIXED VIEW ROW: Displays a scannable monospace counter tracking remaining request quota metrics balances */}
                <div className="flex items-center space-x-5 text-right sm:self-center">
                    <div className="space-y-0.5 border-r border-slate-800 pr-5 hidden sm:block">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">MONTHLY RUN BALANCE</span>
                        <div className="text-[11px] font-black tracking-wide text-slate-200">
                            <span className="text-blue-400 font-bold">{remainingQuota.toLocaleString()}</span> / {limitCap.toLocaleString()} REQS LEFT
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">YOUR PLAN LEVEL</span>
                        <div className="flex items-center justify-end space-x-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isPremium ? 'bg-blue-400' : 'bg-slate-600'}`} />
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${isPremium ? 'text-blue-400' : 'text-slate-400'}`}>
                                {isPremium ? 'PRO PLAN ACTIVE' : 'FREE TIER RUNNING'}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
