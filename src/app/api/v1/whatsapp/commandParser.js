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
    const isCommand = ['vehicle', 'flight', 'power', 'shipping', 'gas'].some(cmd => lowerMessage.startsWith(cmd));

    if (isCommand) {
        await executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin });
        return;
    }

    // Ensure this update is active inside your src/app/api/v1/whatsapp/commandParser.js file:

    const [ledgerQuery, vehiclesQuery, subQuery] = await Promise.all([
        supabaseAdmin.from('referral_payouts_ledger').select('amount_cents, payout_status').eq('referrer_id', userProfile.id),
        supabaseAdmin.from('ecoroute_vehicles').select('registration, registration_number, make, model').eq('user_id', userProfile.id).eq('is_active', true),
        supabaseAdmin.from('user_subscriptions').select('tier, status, user_email').eq('user_id', userProfile.id).eq('app_id', 'ecoroute').maybeSingle()
    ]);

    const availableBalanceCents = (ledgerQuery.data || [])
        .filter(row => row.payout_status === 'unpaid')
        .reduce((sum, row) => sum + row.amount_cents, 0);

    await displayWhatsappMainMenu({
        incomingMessage,
        userProfile,
        tokenRecord,
        availableBalanceCents,
        customVehicles: vehiclesQuery.data || [],
        businessPhoneNumberId,
        cleanPhoneNumber,
        incomingServerUrl,
        subscriptionRecord: subQuery.data // Forward the subscription table values forward flawlessly
    });

}
