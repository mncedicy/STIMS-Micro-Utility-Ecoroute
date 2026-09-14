// src/app/components/home/header/profile/ProfileForm.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ProfileFormView from './ProfileFormView';

export default function ProfileForm({ user, profile, onClose, onChangeToPassword }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', success: false });

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);

    // Tracks if initial profile mapping has run to prevent state overwrite loops
    const hasInitializedProfile = useRef(false);

    // Dynamic UI formatter that adds spaces on-the-fly as the user types
    const formatInputSpacing = (rawValue) => {
        const digits = rawValue.replace(/\D/g, '');

        if (digits.length <= 9) {
            if (digits.length <= 2) return digits;
            if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
            return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
        }

        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 12)}`;
    };

    // Helper to map and parse phone formatting from raw database records
    const loadProfileData = (profileRecord, list) => {
        setName(profileRecord.first_name || '');
        setSurname(profileRecord.surname || '');
        setCompany(profileRecord.company || '');
        setEmail(profileRecord.email || user?.email || '');

        const targetCode = profileRecord.country_code || '';
        setCountryCode(targetCode);

        let matchedCountry = null;
        if (targetCode) {
            matchedCountry = list.find((c) => c.code.toUpperCase() === targetCode.toUpperCase());
            setSelectedCountry(matchedCountry || null);
        } else {
            setSelectedCountry(null);
        }

        let rawPhone = profileRecord.phone_number || '';
        if (rawPhone && matchedCountry && matchedCountry.dial_code) {
            const prefix = matchedCountry.dial_code;
            if (rawPhone.startsWith(prefix)) {
                rawPhone = rawPhone.substring(prefix.length);
            }
        }

        setPhone(formatInputSpacing(rawPhone));
    };

    // 1. Fetch data dictionary ONCE on mount
    useEffect(() => {
        async function fetchCountries() {
            const { data, error } = await supabase
                .from('ecoroute_static_countries')
                .select('id, code, name, continent, dial_code')
                .order('name', { ascending: true });

            if (!error && data) {
                setCountryList(data);
            }
        }
        fetchCountries();
    }, []);

    // 2. Map incoming profile record safely exactly ONCE when database dictionary is ready
    useEffect(() => {
        if (profile && countryList.length > 0 && !hasInitializedProfile.current) {
            loadProfileData(profile, countryList);
            hasInitializedProfile.current = true;
        }
    }, [profile, countryList, user]);

    // Resets form states back to initial database record checkpoints cleanly
    const handleResetFields = () => {
        if (profile && countryList.length > 0) {
            loadProfileData(profile, countryList);
            setMessage({ text: 'Fields reverted to saved profile values.', success: true });
            setTimeout(() => setMessage({ text: '', success: false }), 2000);
        }
    };

    // Clean data string engine to verify inputs right before writing to Supabase
    const cleanAndFormatPhone = (rawPhone, countryObj) => {
        if (!rawPhone.trim()) return '';

        let digits = rawPhone.replace(/\D/g, '');

        if (!countryObj || !countryObj.dial_code) {
            throw new Error('Please select a country to format your number correctly.');
        }

        const prefix = countryObj.dial_code;

        if (digits.startsWith(prefix)) {
            digits = digits.substring(prefix.length);
        }

        if (digits.startsWith('0')) {
            digits = digits.substring(1);
        }

        if (digits.length < 6 || digits.length > 11) {
            throw new Error(`The phone number looks too short or long for ${countryObj.name}.`);
        }

        return prefix + digits;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', success: false });

        try {
            const formattedPhone = cleanAndFormatPhone(phone, selectedCountry);

            if (formattedPhone) {
                const { data: isDuplicate, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('phone_number', formattedPhone)
                    .neq('id', user?.id)
                    .maybeSingle();

                if (checkError) throw checkError;
                if (isDuplicate) {
                    throw new Error('This phone number is already registered to another user profile.');
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: name.trim(),
                    surname: surname.trim(),
                    company: company.trim(),
                    country_code: countryCode.trim().toUpperCase(),
                    phone_number: formattedPhone || null,
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

    return (
        <ProfileFormView
            onSubmit={handleUpdateProfile}
            onReset={handleResetFields}
            loading={loading}
            message={message}
            name={name}
            setName={setName}
            surname={surname}
            setSurname={setSurname}
            company={company}
            setCompany={setCompany}
            email={email}
            phone={phone}
            setPhone={setPhone}
            formatInputSpacing={formatInputSpacing}
            countryList={countryList}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            setCountryCode={setCountryCode}
            onClose={onClose}
            onChangeToPassword={onChangeToPassword}
        />
    );
}
