// src/app/components/home/header/profile/ProfileFormFields.jsx
'use client';

import React from 'react';
import SearchableDropdownField from '../../../shared/SearchableDropdownField';

export default function ProfileFormFields({
    loading,
    name,
    setName,
    surname,
    setSurname,
    company,
    setCompany,
    email,
    phone,
    handlePhoneChange,
    countryList,
    selectedCountry,
    handleSelectCountry,
    isDropdownOpen,
    setIsDropdownOpen
}) {
    return (
        <div className="space-y-3">
            {/* Top Row: Email and Company */}
            <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        placeholder="email@example.com"
                        className="w-full bg-slate-950/30 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono opacity-60 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                        Company
                    </label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full h-[38px] bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-all duration-300"
                    />
                </div>
            </div>

            {/* Middle Row: Name and Surname */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-all duration-300"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                        Surname
                    </label>
                    <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-all duration-300"
                    />
                </div>
            </div>

            {/* Bottom Row: Country Dropdown and Phone Input */}
            <div className="grid grid-cols-2 gap-3 items-end">
                <div className="transition-all duration-300 ease-in-out">
                    <SearchableDropdownField
                        label={
                            <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-slate-400">Country</span>
                                {!selectedCountry && (
                                    <span className="text-rose-500 font-bold tracking-normal animate-pulse">
                                        ⚠️ PLEASE CHOOSE REGION
                                    </span>
                                )}
                            </div>
                        }
                        placeholder="Select Region"
                        searchPlaceholder="Type to filter..."
                        className={`transition-all duration-300 ${!selectedCountry ? 'border-rose-900/50 rounded-lg' : ''}`}
                        valueDisplay={
                            selectedCountry ? (
                                <span className="text-xs text-white transition-opacity duration-300">
                                    {selectedCountry.name} (+{selectedCountry.dial_code})
                                </span>
                            ) : (
                                <span className="text-xs text-rose-400/80 font-semibold font-mono transition-opacity duration-300">Select Region...</span>
                            )
                        }
                        items={countryList}
                        disabled={loading}
                        isOpen={isDropdownOpen}
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        onSelect={handleSelectCountry}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center w-full font-mono text-xs transition-colors duration-200">
                                <span>{item.name}</span>
                                <span className="text-slate-500 text-[10px]">+{item.dial_code}</span>
                            </div>
                        )}
                    />
                </div>
                <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                        Phone
                    </label>
                    <div className="relative flex items-center w-full group">
                        {selectedCountry?.dial_code && (
                            <span className="absolute left-3 text-xs font-mono text-slate-500 select-none transition-all duration-300 ease-in-out opacity-100">
                                +{selectedCountry.dial_code}
                            </span>
                        )}
                        <input
                            type="text"
                            value={phone}
                            onChange={handlePhoneChange}
                            disabled={!selectedCountry}
                            placeholder={selectedCountry ? "e.g., 82 555 1234" : "Choose country first..."}
                            className={`w-full bg-slate-950/80 border rounded-lg py-2 pr-3 text-xs text-white focus:outline-none font-mono transition-all duration-300 ease-in-out ${!selectedCountry
                                ? 'border-slate-900 opacity-40 cursor-not-allowed pl-3 bg-slate-950/40 text-slate-600'
                                : 'border-slate-800 focus:border-blue-500 ' + (selectedCountry?.dial_code ? 'pl-14' : 'pl-3')
                                }`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
