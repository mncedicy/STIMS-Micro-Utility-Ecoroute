'use client';

import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import AuthMessage from './AuthMessage';

export default function ForgotPasswordForm({
    email,
    setEmail,
    handleSubmit,
    loading,
    message,
    turnstileRef,
    turnstileSiteKey,
    setCaptchaToken,
    captchaToken,
    switchMode
}) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-white text-base font-bold uppercase tracking-wider">Reset Password</h2>
            <p className="text-slate-400 text-xs">Enter your email address to receive recovery instructions.</p>

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
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50"
                />
            </div>

            <div className="my-2 flex justify-center">
                <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken('')}
                    options={{ theme: 'dark', size: 'normal' }}
                />
            </div>

            <AuthMessage message={message} />

            <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
                {loading ? 'Sending...' : 'Send Recovery Email ➔'}
            </button>

            <div className="pt-2 text-center">
                <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-blue-400 hover:text-blue-300 font-bold uppercase text-[10px] tracking-wide cursor-pointer"
                >
                    Back to Sign In
                </button>
            </div>
        </form>
    );
}