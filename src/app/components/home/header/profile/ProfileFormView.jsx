// src/app/components/home/header/profile/ProfileFormView.jsx
'use client';

import React, { useState } from 'react';
import ProfileFormFields from './ProfileFormFields';

export default function ProfileFormView({
    onSubmit,
    onReset,
    loading,
    message,
    name,
    setName,
    surname,
    setSurname,
    company,
    setCompany,
    email,
    phone,
    setPhone,
    formatInputSpacing,
    countryList,
    selectedCountry,
    setSelectedCountry,
    setCountryCode,
    onClose,
    onChangeToPassword
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSelectCountry = (item) => {
        if (!item) {
            setSelectedCountry(null);
            setCountryCode('');
            return;
        }
        setSelectedCountry(item);
        setCountryCode(item.code);
        setIsDropdownOpen(false);
    };

    const handlePhoneChange = (e) => {
        const formatted = formatInputSpacing(e.target.value);
        setPhone(formatted);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3 transition-all duration-300 ease-in-out">
            {/* Split field configuration items */}
            <ProfileFormFields
                loading={loading}
                name={name}
                setName={setName}
                surname={surname}
                setSurname={setSurname}
                company={company}
                setCompany={setCompany}
                email={email}
                phone={phone}
                handlePhoneChange={handlePhoneChange}
                countryList={countryList}
                selectedCountry={selectedCountry}
                handleSelectCountry={handleSelectCountry}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
            />

            {/* Notification messages indicator */}
            {message.text && (
                <p className={`text-[10px] font-mono transition-all duration-300 ${message.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {message.text}
                </p>
            )}

            {/* Form actions and controls buttons */}
            <div className="flex flex-col space-y-2 pt-2">
                <div className="flex justify-start">
                    <button
                        type="button"
                        onClick={onChangeToPassword}
                        className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer"
                    >
                        🔑 Change Password?
                    </button>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={loading}
                        className="px-3 py-2 rounded-lg text-[10px] hover:bg-slate-900 border border-slate-800 text-amber-500 hover:text-amber-400 font-bold uppercase transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm disabled:opacity-30"
                    >
                        Reset Form
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg text-[10px] hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold uppercase transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !selectedCountry}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 stims-hover-glow shadow-sm"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
}
