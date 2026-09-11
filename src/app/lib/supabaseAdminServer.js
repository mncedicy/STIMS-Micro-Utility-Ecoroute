// src/app/lib/supabaseAdminServer.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Ensure this key is defined in your production .env dashboard variables.
// NEVER prefix this specific secret string configuration token with NEXT_PUBLIC_
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("EcoRoute Server Guard: Missing infrastructure administrative role keys.");
}

/**
 * Superuser Administrative Supabase instance context tailored for secure server executions.
 * This client bypasses RLS policies entirely and must only be executed within Next.js API Routes.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
