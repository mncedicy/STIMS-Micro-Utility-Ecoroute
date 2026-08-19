// src/app/onboarding/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        surname: '',
        company: '',
        countryCode: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        async function loadUserData() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                // No active session -> return home
                router.push('/');
                return;
            }

            const user = session.user;
            const meta = user.user_metadata || {};

            // Parse name from Google meta if surname/first_name aren't distinct
            const full = meta.full_name || meta.name || '';
            const nameParts = full.split(' ');
            const defaultFirst = meta.first_name || meta.given_name || nameParts[0] || '';
            const defaultSurname = meta.surname || meta.family_name || nameParts.slice(1).join(' ') || '';

            setFormData((prev) => ({
                ...prev,
                email: user.email || '',
                firstName: defaultFirst,
                surname: defaultSurname,
                company: meta.company || '',
                countryCode: meta.country_code || '',
            }));

            setLoading(false);
        }

        loadUserData();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!formData.company.trim() || !formData.countryCode.trim()) {
            setError('Company and Country Code are required.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error('Active session lost. Please sign in with Google again.');
            }

            const trimmedFirstName = formData.firstName.trim();
            const trimmedSurname = formData.surname.trim();
            const trimmedCompany = formData.company.trim();
            const trimmedCountry = formData.countryCode.trim().toUpperCase();

            // 1. Update Auth raw_user_meta_data and set account password
            const { error: updateAuthError } = await supabase.auth.updateUser({
                password: formData.password,
                data: {
                    first_name: trimmedFirstName,
                    surname: trimmedSurname,
                    company: trimmedCompany,
                    country_code: trimmedCountry,
                },
            });

            if (updateAuthError) throw updateAuthError;

            // 2. Explicitly write/update row in public.profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    first_name: trimmedFirstName,
                    surname: trimmedSurname,
                    company: trimmedCompany,
                    country_code: trimmedCountry,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            // 3. Complete onboarding immediately without sending any email
            setMessage('Registration complete! Initializing dashboard...');

            setTimeout(() => {
                router.push('/?login=success');
            }, 1200);

        } catch (err) {
            setError(err.message || 'An error occurred while setting up your account.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-mono">
                <p className="text-xs text-slate-400">Loading registration profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-1">Complete Registration</h2>
                <p className="text-xs text-slate-400 mb-6">
                    Provide your company details and set a password to finish setup.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email (Disabled) */}
                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs cursor-not-allowed opacity-75"
                        />
                    </div>

                    {/* First Name & Surname */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                Surname
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Company & Country */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                Company
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Enterprise Inc."
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                Country Code
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={3}
                                placeholder="ZA"
                                value={formData.countryCode}
                                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs uppercase focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                Set Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all uppercase"
                    >
                        {submitting ? 'Completing Registration...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
}