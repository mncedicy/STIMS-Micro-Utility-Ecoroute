// /src/app/components/AuthScreen.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthTabs from './auth/AuthTabs';
import SignupFields from './auth/SignupFields';

export default function AuthScreen({ onAuthSuccess }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');

    const [countryList, setCountryList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ success: null, text: "" });

    // Fetch dynamic country listings from your static database table indexes
    useEffect(() => {
        async function loadStaticCountriesRegistry() {
            try {
                const { data, error } = await supabase
                    .from('ecoroute_static_countries')
                    .select('id, code, name, continent')
                    .order('name', { ascending: true });
                if (!error && data) setCountryList(data);
            } catch (err) {
                console.error('[Static Countries Hydration Fault]:', err);
            }
        }
        loadStaticCountriesRegistry();
    }, []);

    const handleForgotPasswordResetClick = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setMessage({ success: false, text: "Please type your email address into the input field above first, then click Forgot Password again." });
            return;
        }

        setLoading(true);
        setMessage({ success: null, text: "" });

        try {
            const redirectUrl = `${window.location.origin}/update-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: redirectUrl,
            });

            if (error) throw error;
            setMessage({ success: true, text: "Success! We sent a password reset link to your email. Please check your inbox and click the link to reset your password." });
        } catch (error) {
            setMessage({ success: false, text: error.message || "Failed to trigger recovery email link." });
        } finally {
            setLoading(false);
        }
    };

    const handleAuthActionSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ success: null, text: "" });

        try {
            if (mode === 'login') {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: email.trim(), password: password.trim()
                });
                if (loginError) throw loginError;

                setMessage({ success: true, text: "Access Authorization Cleared. Initializing Dashboard..." });
                if (typeof onAuthSuccess === 'function') onAuthSuccess();
            } else {
                if (!firstName.trim()) throw new Error("First name configuration is mandatory.");
                if (!selectedCountry) throw new Error("Please select your country of operations.");

                const resolvedCleanCode = selectedCountry.code.toString().trim().toUpperCase();

                // FIXED AUTH REGISTRATION MAP: Keys match your handle_new_user_signup function variables exactly
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password.trim(),
                    options: {
                        data: {
                            first_name: firstName.trim(),
                            surname: surname.trim() || '',
                            company: company.trim() || '',
                            country_code: resolvedCleanCode
                        }
                    }
                });

                if (signUpError) throw signUpError;
                if (!signUpData?.user) throw new Error("Registration identity instantiation timed out.");

                // Manual profile insert ensures fields populate immediately on the client-side profile cache mount
                const { error: profileInsertError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: signUpData.user.id,
                            first_name: firstName.trim(),
                            surname: surname.trim() || null,
                            company: company.trim() || null,
                            country_code: resolvedCleanCode,
                            updated_at: new Date().toISOString()
                        }
                    ]);

                if (profileInsertError && !profileInsertError.message?.includes('duplicate key')) {
                    throw profileInsertError;
                }

                setMessage({ success: true, text: "Registration Successful! Profile initialized seamlessly." });
                if (typeof onAuthSuccess === 'function') onAuthSuccess();
            }
        } catch (error) {
            setMessage({ success: false, text: error.message || "Authentication verification transaction dropped." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-slate-900/40 border border-slate-900 rounded-xl p-6 backdrop-blur-sm shadow-xl font-mono text-xs text-left relative z-10 stims-hover-glow">
            <AuthTabs mode={mode} setMode={setMode} clearMessage={() => setMessage({ success: null, text: "" })} />

            <form onSubmit={handleAuthActionSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <SignupFields
                        loading={loading} firstName={firstName} setFirstName={setFirstName}
                        surname={surname} setSurname={setSurname} company={company} setCompany={setCompany}
                        countryList={countryList} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
                        isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen}
                    />
                )}

                <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1.5 text-[10px]">Email Address</label>
                    <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.co.za" required disabled={loading}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1.5 text-[10px]">Password Security Pin</label>
                    <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" required={mode === 'login'} disabled={loading}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                    />

                    {mode === 'login' && (
                        <div className="text-right mt-1.5 select-none">
                            <button
                                type="button"
                                onClick={handleForgotPasswordResetClick}
                                disabled={loading}
                                className="text-[10px] text-blue-500 hover:text-blue-400 bg-transparent border-none outline-none cursor-pointer uppercase font-bold tracking-wide transition-colors disabled:opacity-40"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                </div>

                {message.text && (
                    <div className={`p-3 rounded-lg text-[11px] border leading-normal font-mono ${message.success ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-rose-950/20 border-rose-500/20 text-rose-400'}`}>
                        <div className="flex items-center space-x-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${message.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="normal-case leading-normal">{message.text}</span>
                        </div>
                    </div>
                )}

                <button
                    type="submit" disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center justify-center space-x-2 stims-hover-glow transform hover:-translate-y-0.5 duration-150"
                >
                    {loading ? "Processing Secure Keylocks..." : mode === 'login' ? 'Authorize Secure Session ➔' : 'Register Corporate Ledger Profile ➔'}
                </button>
            </form>
        </div>
    );
}
