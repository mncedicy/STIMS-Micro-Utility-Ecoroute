// src/app/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("EcoRoute Guard: Missing subdomain Supabase initialization tokens.");
}

const getCookieOptions = () => {
    if (typeof window === 'undefined') return {};
    const hostname = window.location.hostname;

    // LOCAL TESTING: Omit domain so localhost ports (3000, 3001, etc.) can read and write cookies natively
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return {
            path: '/',
            sameSite: 'lax',
            secure: false, // Must be false for local HTTP ports
            maxAge: 60 * 60 * 24 * 7 // 1 Week
        };
    }

    // PRODUCTION: Force wildcard subdomains across *.stims.co.za
    return {
        domain: '.stims.co.za',
        path: '/',
        sameSite: 'lax',
        secure: true, // Requires production HTTPS enforcement
        maxAge: 60 * 60 * 24 * 7 // 1 Week
    };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'stims-enterprise-sso', // Must match EXACTLY across all ecosystem platforms
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        cookieOptions: getCookieOptions()
    }
});
