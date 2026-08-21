// src\app\components\auth\SignupFields.jsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import SearchableDropdownField from '../shared/SearchableDropdownField';

export default function SignupFields({
    email,
    setEmail,
    firstName,
    setFirstName,
    surname,
    setSurname,
    company,
    setCompany,
    countryCode,
    setCountryCode,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading
}) {
    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        async function fetchCountries() {
            const { data, error } = await supabase
                .from('ecoroute_static_countries')
                .select('id, code, name, continent')
                .order('name', { ascending: true });

            if (!error && data) {
                setCountryList(data);

                if (countryCode) {
                    const match = data.find((c) => c.code.toUpperCase() === countryCode.toUpperCase());
                    if (match) setSelectedCountry(match);
                }
            }
        }
        fetchCountries();
    }, []);

    const handleSelectCountry = (item) => {
        setSelectedCountry(item);
        setCountryCode(item.code);
        setIsDropdownOpen(false);
    };

    const passwordStrength = useMemo(() => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
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
    }, [password]);

    return (
        <div className="space-y-4">
            <div className="space-y-4 border-b border-slate-800 pb-4">
                {/* Email Address */}
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
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                    />
                </div>

                {/* First Name & Surname */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                            First Name *
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                            disabled={loading}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                            Surname *
                        </label>
                        <input
                            type="text"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            placeholder="Doe"
                            required
                            disabled={loading}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Company & Country side-by-side */}
                <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                            Company *
                        </label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Acme Corp"
                            required
                            disabled={loading}
                            className="w-full h-[38px] bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <SearchableDropdownField
                            label={
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Country of Operations *
                                </span>
                            }
                            placeholder="Select Region"
                            searchPlaceholder="Type to filter..."
                            valueDisplay={
                                selectedCountry ? (
                                    <span className="text-xs text-white">
                                        {selectedCountry.name} ({selectedCountry.code})
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-500">Select Region</span>
                                )
                            }
                            items={countryList}
                            disabled={loading}
                            isOpen={isDropdownOpen}
                            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                            onSelect={handleSelectCountry}
                            renderItem={(item) => <span className="text-xs">{item.name} ({item.code})</span>}
                        />
                    </div>
                </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                        Password *
                    </label>
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

                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                        Confirm Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className={`w-full bg-slate-950/80 border rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono disabled:opacity-50 ${confirmPassword && password !== confirmPassword
                                ? 'border-rose-500 focus:border-rose-500'
                                : 'border-slate-800 focus:border-blue-500'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                            {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-[10px] text-rose-400 mt-1 normal-case">
                            Passwords do not match.
                        </p>
                    )}
                </div>
            </div>

            {/* Password Strength Bar */}
            {password && (
                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Password Strength:</span>
                        <span className={`font-bold uppercase ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'}`} />
                    </div>
                </div>
            )}
        </div>
    );
}