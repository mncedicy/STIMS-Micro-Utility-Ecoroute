// src/app/actions/backup.js

"use server";

import { updateUsage } from '../utils/dispatch/tokenHelpers';

/**
 * Validates and charges a corporate token for raw ledger backup downloads
 */
export async function chargeTokenForBackup(userId) {
    if (!userId) {
        return { success: false, error: "Missing active account tracking credentials." };
    }

    try {
        const usageResult = await updateUsage(userId, 1);
        if (usageResult.exceeded) {
            return { success: false, error: usageResult.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[Backup Quota Gate Failure]:', err);
        return { success: false, error: "Internal processing disruption." };
    }
}
