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

    // 1. If an operator sends a direct command, clear any temporary menu steps and execute calculation
    if (isDirectTextCommand) {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: null, pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await executeEmissionsCalculations({ lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin });
        return;
    }

    // 2. FIXED: Route all numeric/text entries through the state engine first to check for sub-menu or wizard step interactions
    const wasStateHandled = await executeEmissionsCalculations({
        lowerMessage, userProfile, tokenRecord, currentUsage, usageCap, businessPhoneNumberId, cleanPhoneNumber, supabaseAdmin
    });

    // If caught by sub-menu selections or dynamic prompts, stop execution here
    if (wasStateHandled) return;

    // 3. If no state is active and no sub-menu matches, default back to top-level menu presentation
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
        subscriptionRecord: subQuery.data,
        supabaseAdmin
    });
}
