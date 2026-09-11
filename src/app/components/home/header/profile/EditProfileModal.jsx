'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';

export default function EditProfileModal({ isOpen, onClose, user, profile }) {
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState('profile'); // 'profile' or 'password'

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) setViewMode('profile');
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-10 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 transition-all duration-300 stims-hover-glow shadow-sm relative top-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {viewMode === 'profile' ? 'UPDATE DETAILS' : 'CHANGE PASSWORD'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 text-sm font-bold transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm p-1 rounded"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {viewMode === 'profile' ? (
                    <ProfileForm
                        user={user}
                        profile={profile}
                        onClose={onClose}
                        onChangeToPassword={() => setViewMode('password')}
                    />
                ) : (
                    <PasswordForm
                        onClose={onClose}
                        onBackToProfile={() => setViewMode('profile')}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}
