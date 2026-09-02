// src/app/components/home/header/EditProfileModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabaseClient';
import SearchableDropdownField from '../../shared/SearchableDropdownField';

export default function EditProfileModal({ isOpen, onClose, user, profile }) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', success: false });

    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');
    const [countryCode, setCountryCode] = useState('');

    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setSurname(profile.surname || '');
            setCompany(profile.company || '');
            setCountryCode(profile.country_code || '');

            if (countryList.length > 0 && profile.country_code) {
                const match = countryList.find((c) => c.code.toUpperCase() === profile.country_code.toUpperCase());
                if (match) setSelectedCountry(match);
            }
        }
    }, [profile, countryList]);

    const handleSelectCountry = (item) => {
        setSelectedCountry(item);
        setCountryCode(item.code);
        setIsDropdownOpen(false);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', success: false });

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName.trim(),
                    surname: surname.trim(),
                    company: company.trim(),
                    country_code: countryCode.trim().toUpperCase(),
                })
                .eq('id', user?.id);

            if (error) throw error;

            setMessage({ text: 'Profile updated successfully!', success: true });
            setTimeout(() => {
                onClose();
                setMessage({ text: '', success: false });
                window.location.reload();
            }, 1200);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to update profile.', success: false });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-10 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 transition-all duration-300 stims-hover-glow shadow-sm relative top-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        UPDATE DETAILS
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 text-sm font-bold transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm p-1 rounded"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
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
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                                Company
                            </label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Acme Corp"
                                className="w-full h-[38px] bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            />
                        </div>

                        <div>
                            <SearchableDropdownField
                                label={
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Country
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

                    {message.text && (
                        <p className={`text-[10px] ${message.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {message.text}
                        </p>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 rounded-lg text-[10px] hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold uppercase transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg disabled:opacity-50 transition-all duration-300 stims-hover-glow cursor-pointer shadow-sm"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}