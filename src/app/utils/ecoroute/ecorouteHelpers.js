// src/app/utils/ecoroute/ecorouteHelpers.js

import { supabase } from '../../lib/supabaseClient';

/**
 * Handles estimate calculation API call
 */
export async function calculateEstimate(formPayload) {
    const { data: currentSessionData } = await supabase.auth.getSession();
    const accessToken = currentSessionData?.session?.access_token || '';

    const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify(formPayload),
    });

    const result = await res.json();
    if (!res.ok || result.error) {
        throw new Error(result.error || 'Offline calculation rejected.');
    }

    return result.data;
}