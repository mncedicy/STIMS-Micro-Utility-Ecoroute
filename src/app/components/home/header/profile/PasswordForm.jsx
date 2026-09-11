'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function PasswordForm({ onClose, onBackToProfile }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', success: false });

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Toggle states for text visibility
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Password strength logic
    const passwordStrength = useMemo(() => {
        const checks = {
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[^A-Za-z0-9]/.test(newPassword),
        };

        const score = Object.values(checks).filter(Boolean).length;

        let label = 'Weak';
        let color = 'bg-rose-500';

        if (score >= 4) {
            label = 'Strong';
            color = 'bg-emerald-500';
        } else if (score >= 2) {
            label = 'Medium';
            color = 'bg-amber-500';
        }

        return { checks, score, label, color };
    }, [newPassword]);

    // Validation helper to explicitly check for strong score requirement
    const isStrong = passwordStrength.score >= 4;

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (!isStrong) {
            setMessage({ text: 'Password must be Strong to update.', success: false });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match.', success: false });
            return;
        }

        setLoading(true);
        setMessage({ text: '', success: false });

        try {
            // Passes current_password natively to Supabase to verify context before write authorization
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
                current_password: currentPassword
            });

            if (error) throw error;

            setMessage({ text: 'Password changed successfully! Closing...', success: true });
            setTimeout(() => {
                onClose(); // Closes the entire modal wrapper hierarchy
            }, 1200);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to update password.', success: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdatePassword} className="space-y-3">
            {/* Current Password Field */}
            <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Current Password
                </label>
                <div className="relative">
                    <input
                        type={showCurrent ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm p-1 cursor-pointer"
                    >
                        {showCurrent ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>

            {/* New Password Field */}
            <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    New Password
                </label>
                <div className="relative">
                    <input
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm p-1 cursor-pointer"
                    >
                        {showNew ? '🙈' : '👁️'}
                    </button>
                </div>

                {/* Password Strength Indicator Bars */}
                {newPassword && (
                    <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                            <span className="text-slate-500">Strength:</span>
                            <span className={isStrong ? 'text-emerald-400' : passwordStrength.score >= 2 ? 'text-amber-400' : 'text-rose-400'}>
                                {passwordStrength.label} {!isStrong && '(Required: Strong)'}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1">
                            {[1, 2, 3, 4].map((index) => (
                                <div
                                    key={index}
                                    className={`h-full rounded-sm transition-colors duration-300 ${passwordStrength.score >= index ? passwordStrength.color : 'bg-slate-800'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Password Field */}
            <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Confirm New Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm p-1 cursor-pointer"
                    >
                        {showConfirm ? '🙈' : '👁️'}
                    </button>
                </div>
            </div>

            {message.text && (
                <p className={`text-[10px] ${message.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {message.text}
                </p>
            )}

            <div className="flex flex-col space-y-2 pt-2">
                <div className="flex justify-start">
                    <button
                        type="button"
                        onClick={onBackToProfile}
                        className="text-slate-400 hover:text-slate-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        ⬅️ Back to Profile Details
                    </button>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg text-[10px] hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold uppercase transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !isStrong}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </form>
    );
}
