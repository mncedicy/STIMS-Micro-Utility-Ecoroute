// src\app\components\home\header\Header.jsx

'use client';

import React, { useState } from 'react';
import EditProfileModal from './EditProfileModal';
import QuotaUsageBadge from './QuotaUsageBadge';

export default function Header({ user, profile, isPremium, quotaReached, currentUsage = 0, limitCap = 100 }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-1.5 py-0.5 rounded text-[10px] hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                            title="Edit Details"
                            type="button"
                        >
                            ✏️ EDIT
                        </button>
                    </div>
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                        WELCOME BACK, {userNameString.trim()}
                    </h2>
                    {(profile?.company || profile?.country_code) && (
                        <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-slate-400 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded block w-fit">
                                {[
                                    profile.company?.toUpperCase(),
                                    profile.country_code?.toUpperCase()
                                ].filter(Boolean).join(' • ')}
                            </span>
                        </div>
                    )}
                </div>

                <QuotaUsageBadge
                    currentUsage={currentUsage}
                    limitCap={limitCap}
                    isPremium={isPremium}
                />

            </div>

            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                profile={profile}
            />
        </div>
    );
}