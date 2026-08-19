// /src/app/components/auth/SignupFields.jsx
'use client';

import React from 'react';
import SearchableDropdownField from '../SearchableDropdownField';

export default function SignupFields({
    loading,
    firstName, setFirstName,
    surname, setSurname,
    company, setCompany,
    countryList, selectedCountry, setSelectedCountry,
    isDropdownOpen, setIsDropdownOpen
}) {
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Row 1: First Name & Surname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                        Surname
                    </label>
                    <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Doe"
                        disabled={loading}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                </div>
            </div>

            {/* Row 2: Company & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                        Company / Organization
                    </label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Enterprise Fleet Solutions"
                        disabled={loading}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                </div>

                <div>
                    <SearchableDropdownField
                        label="Country of Operations *"
                        placeholder="Select Your Region"
                        searchPlaceholder="Type country name to filter..."
                        valueDisplay={selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : ''}
                        items={countryList}
                        disabled={loading}
                        isOpen={isDropdownOpen}
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        onSelect={(item) => setSelectedCountry(item)}
                        renderItem={(item) => `${item.name} (${item.code})`}
                    />
                </div>
            </div>
        </div>
    );
}