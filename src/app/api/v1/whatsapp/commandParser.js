// src/app/api/v1/whatsapp/commandParser.js

import { executeEmissionsCalculations } from './commandCalculations';
import { displayWhatsappMainMenu } from './commandMenu';

export async function handleIncomingCommand({
    incomingMessage,
    userProfile,
    tokenRecord,
    currentUsage,
    usageCap,
    businessPhoneNumberId,
    cleanPhoneNumber,
    supabaseAdmin,
    incomingServerUrl
}) {
    const lowerMessage = String(incomingMessage || '').trim().toLowerCase();
    const isDirectTextCommand = ['vehicle', 'flight', 'power', 'shipping', 'gas'].some(cmd => lowerMessage.startsWith(cmd));

    if (isDirectTextCommand) {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin });
        return;
    }

    const wasStateHandled = await executeEmissionsCalculations({
        lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin
    });

    if (wasStateHandled === true) {
        return;
    }

    // FIXED: Dropped the invalid non-existent 'registration' column name from the query parameters selection matrix safely
    const [ledgerQuery, vehiclesQuery, subQuery] = await Promise.all([
        supabaseAdmin.from('referral_payouts_ledger').select('amount_cents, payout_status').eq('referrer_id', userProfile.id),
        supabaseAdmin.from('ecoroute_vehicles').select('id, registration_number, make, model, is_active').eq('user_id', userProfile.id),
        supabaseAdmin.from('user_subscriptions').select('tier, status, user_email').eq('user_id', userProfile.id).eq('app_id', 'ecoroute').maybeSingle()
    ]);

    const availableBalanceCents = (ledgerQuery.data || [])
        .filter(row => row.payout_status === 'unpaid')
        .reduce((sum, row) => sum + row.amount_cents, 0);

    const activeVehiclesList = (vehiclesQuery.data || []).filter(veh => veh.is_active !== false);

    await displayWhatsappMainMenu({
        incomingMessage,
        userProfile,
        tokenRecord,
        availableBalanceCents,
        customVehicles: activeVehiclesList,
        businessPhoneNumberId,
        cleanPhoneNumber,
        incomingServerUrl,
        subscriptionRecord: subQuery.data,
        supabaseAdmin
    });
}
