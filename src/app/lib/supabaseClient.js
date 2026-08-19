// src/app/lib/supabaseClient.js
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("EcoRoute Guard: Missing subdomain Supabase initialization tokens.");
}

/**
 * Dynamically resolves cookie configuration parameters 
 * based on the current execution hostname.
 */
const getCookieOptions = () => {
    if (typeof window === 'undefined') return {};
    const hostname = window.location.hostname;

    // Local environment setup
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return {
            path: '/',
            sameSite: 'lax',
            secure: false, // Must be false for local HTTP ports
            maxAge: 60 * 60 * 24 * 7 // 1 Week
        };
    }

    // Enterprise production setup for cross-subdomain SSO
    return {
        domain: '.stims.co.za',
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 7 // 1 Week
    };
};

/**
 * Shared Supabase Client Instance (Browser / SSR support)
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getCookieOptions(),
    auth: {
        storageKey: 'stims-enterprise-sso',
        flowType: 'pkce',
    }
});

/**
 * Updates the current authenticated user's raw metadata in Supabase Auth.
 * 
 * @param {Object} params
 * @param {string} [params.firstName] - User's first name
 * @param {string} [params.surname] - User's surname
 * @param {string} [params.company] - Associated company
 * @param {string} [params.countryCode] - ISO Country Code (e.g., ZA, US)
 * @returns {Promise<Object>} Updated user data object
 */
export async function updateUserMetadata({ firstName, surname, company, countryCode }) {
    const metadataUpdate = {};

    if (firstName !== undefined) metadataUpdate.first_name = firstName.trim();
    if (surname !== undefined) metadataUpdate.surname = surname.trim();
    if (company !== undefined) metadataUpdate.company = company.trim();
    if (countryCode !== undefined) metadataUpdate.country_code = countryCode.trim().toUpperCase();

    const { data, error } = await supabase.auth.updateUser({
        data: metadataUpdate,
    });

    if (error) {
        throw new Error(error.message || 'Failed to update user profile metadata.');
    }

    return data;
}