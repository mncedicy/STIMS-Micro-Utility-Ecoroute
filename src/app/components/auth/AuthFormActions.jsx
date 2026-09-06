// src/app/components/auth/AuthFormActions.jsx
'use client';

import React from 'react';
import AuthMessage from './AuthMessage';

export default function AuthFormActions({
    mode,
    loading,
    captchaToken,
    message,
    switchMode
}) {
    return (
        <div className="space-y-4 mt-2">
            <AuthMessage message={message} />

            <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
                {loading
                    ? 'Processing...'
                    : mode === 'login'
                        ? 'Authorize Session ➔'
                        : 'Create Account ➔'}
            </button>

            <div className="pt-4 text-center border-t border-slate-800/60 mt-4 text-slate-400 text-[11px] normal-case">
                {mode === 'login' ? (
                    <p>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => switchMode('signup')}
                            className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1 uppercase text-[10px] tracking-wide cursor-pointer"
                        >
                            Sign Up
                        </button>
                    </p>
                ) : (
                    <p>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="text-blue-400 hover:text-blue-300 font-bold transition-colors ml-1 uppercase text-[10px] tracking-wide cursor-pointer"
                        >
                            Sign In
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
