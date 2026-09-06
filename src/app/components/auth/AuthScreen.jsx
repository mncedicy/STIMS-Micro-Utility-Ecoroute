// src/app/components/auth/AuthScreen.jsx
'use client';

import React, { useState, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

import SignupFields from './SignupFields';
import ForgotPasswordForm from './ForgotPasswordForm';
import LoginFormSheet from './LoginFormSheet';
import AuthFormActions from './AuthFormActions';
import SocialAuth from './SocialAuth';
import { useAuthSubmit } from './useAuthSubmit';

export default function AuthScreen() {
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'

    // Form Field States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');
    const [countryCode, setCountryCode] = useState('');

    // Toggle Visibility UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Captcha Control References
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    const switchMode = (newMode) => {
        setMode(newMode);
        setCaptchaToken('');
        turnstileRef.current?.reset();
        setAuthMessage({ text: '', success: false });
        setPassword('');
        setConfirmPassword('');
    };

    const resetCaptcha = () => {
        setCaptchaToken('');
        turnstileRef.current?.reset();
    };

    // Import the custom action hook
    const {
        loading,
        message,
        handleSubmit,
        handleGoogleSignIn,
        setMessage: setAuthMessage
    } = useAuthSubmit({
        email, password, confirmPassword, firstName, surname, company, countryCode,
        captchaToken, resetCaptcha, switchMode, mode
    });

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl text-left">
            {mode === 'forgot' ? (
                <ForgotPasswordForm
                    email={email} setEmail={setEmail} handleSubmit={handleSubmit}
                    loading={loading} message={message} turnstileRef={turnstileRef}
                    turnstileSiteKey={turnstileSiteKey} setCaptchaToken={setCaptchaToken}
                    captchaToken={captchaToken} switchMode={switchMode}
                />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' ? (
                        <SignupFields
                            email={email} setEmail={setEmail} firstName={firstName} setFirstName={setFirstName}
                            surname={surname} setSurname={setSurname} company={company} setCompany={setCompany}
                            countryCode={countryCode} setCountryCode={setCountryCode} password={password} setPassword={setPassword}
                            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                            showPassword={showPassword} setShowPassword={setShowPassword}
                            showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                            loading={loading}
                        />
                    ) : (
                        <LoginFormSheet
                            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                            showPassword={showPassword} setShowPassword={setShowPassword}
                            switchMode={switchMode} loading={loading}
                        />
                    )}

                    <div className="my-2 flex justify-center">
                        <Turnstile
                            ref={turnstileRef} siteKey={turnstileSiteKey}
                            onSuccess={(token) => setCaptchaToken(token)} onExpire={() => setCaptchaToken('')}
                            options={{ theme: 'dark', size: 'normal' }}
                        />
                    </div>

                    <AuthFormActions
                        mode={mode} loading={loading} captchaToken={captchaToken}
                        message={message} switchMode={switchMode}
                    />

                    <SocialAuth handleGoogleSignIn={handleGoogleSignIn} loading={loading} />
                </form>
            )}
        </div>
    );
}
