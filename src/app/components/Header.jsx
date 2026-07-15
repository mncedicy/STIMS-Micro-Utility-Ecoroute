'use client';

import React from 'react';

export default function Header({ user, profile, isPremium, quotaReached }) {
    // FIXED: Added [0] so it takes the first string block of the email, preventing the array crash
    const userNameString = profile?.first_name
        ? `${profile.first_name} ${profile.surname || ''}`
        : user?.email?.split('@')[0] || 'User';

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

                <div className="flex items-center space-x-3 text-right">
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
