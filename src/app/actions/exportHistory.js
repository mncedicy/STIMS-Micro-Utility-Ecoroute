// src/app/actions/exportHistory.js

"use server";

import { createClient } from '@supabase/supabase-js';

// Safe administrative bypass client instance running natively within the server container context
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Securely retrieves compliance export trail history logs directly on the server side,
 * completely bypassing client-side RLS context dropped parameters.
 */
export async function getExportHistoryLedger(userId) {
    if (!userId) {
        return { success: false, error: "Target tracking identification credential parameters dropped.", data: [] };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ecoroute_export_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ExportHistory Action Database Read Failure]:', error.message);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (err) {
        console.error('[ExportHistory Action Critical Crash Exception]:', err.message);
        return { success: false, error: err.message, data: [] };
    }
}
