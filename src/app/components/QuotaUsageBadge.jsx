'use client';

import React from 'react';

export default function QuotaUsageBadge({ currentUsage = 0, limitCap = 100, isPremium }) {
    const remainingQuota = Math.max(0, limitCap - currentUsage);

    return (
        <div className="flex items-center space-x-5 text-right sm:self-center font-mono">
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
    );
}