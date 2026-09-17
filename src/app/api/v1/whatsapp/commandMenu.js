// src/app/api/v1/whatsapp/commandMenu.js

import { sendMetaWhatsappMessage } from './metaClient';

export async function displayWhatsappMainMenu({
    incomingMessage,
    userProfile,
    tokenRecord,
    availableBalanceCents = 0,
    customVehicles = [],
    businessPhoneNumberId,
    cleanPhoneNumber,
    incomingServerUrl,
    subscriptionRecord,
    supabaseAdmin
}) {
    const cleanInput = String(incomingMessage || '').trim().toLowerCase();
    const currentSubStatus = String(subscriptionRecord?.status || 'free').toLowerCase();
    const isFreeTier = currentSubStatus !== 'active';
    const firstName = userProfile?.first_name || 'Partner';
    const companyName = userProfile?.company ? ` (${userProfile.company})` : '';
    const availableZar = availableBalanceCents / 100;

    if (cleanInput === '1') {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'INSIDE_CALCULATOR_SUBMENU', updated_at: new Date().toISOString() })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `📊 *1. AUDIT CALCULATOR SUB-MENU* \n\n` +
            `1 Vehicle\n` +
            `2 Shipping\n` +
            `3 Flight\n` +
            `4 Electricity\n` +
            `5 Gas`
        );
        return;
    }

    // FIXED: Intercept Option 2 selection input to switch state flag immediately, triggering dynamic trace wizard prompts
    if (cleanInput === '2') {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_ROUTE_DISTANCE', pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `🗺️ *2. ROUTE CHECKER WIZARD RUN* \n\n` +
            `Please type the terrestrial distance path length to verify tracking optimizations:\n\n` +
            `*ROUTE TOTAL DISTANCE (KM)*`
        );
        return;
    }

    if (cleanInput === '3') {
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `🏛️ *3. STATUTORY TAX LEGER REPORT* \n\n` +
            `To output compliance auditing spreadsheets under SARS regime parameters, calculate tax window frames inside your console dashboard panel.\n\n` +
            `💡 *Usage Note*: Detailed multi-period ledgers are compiled securely via standard web dash interfaces.`
        );
        return;
    }

    if (cleanInput === '4') {
        let text = `💰 *4. REFERRALS EARNING BASES* 💰\n\n• Unpaid Wallet Balance: *R${availableZar.toFixed(2)} ZAR*\n\n`;
        if (availableZar >= 100) {
            text += `👉 *Reply with "withdraw"* to trigger a manual disbursement execution run via Paystack gateways.`;
        } else {
            text += `ℹ️ _Note: A minimum of R100.00 is required to trigger cashout payment modules._`;
        }
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, text);
        return;
    }

    if (cleanInput === '5') {
        let text = `🚛 *5. REGISTERED FLEET ASSET NODES* \n\n`;
        if (customVehicles.length > 0) {
            customVehicles.forEach((veh) => {
                const reg = String(veh.registration_number || 'FLEET').toUpperCase();
                const make = (veh.make || 'ASSET').toUpperCase();
                text += `• ${reg} - ${make}\n`;
            });
        } else {
            text += `ℹ️ No active fleet assets linked to your corporate sustainability profiles.`;
        }
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, text);
        return;
    }

    if (cleanInput === '6' && isFreeTier) {
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Connecting to checkout gateways... Please check your tray link to complete verification upgrades.`);
        try {
            const hostUrl = incomingServerUrl || 'https://stims.co.za';
            const apiRes = await fetch(`${hostUrl}/api/checkout/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userProfile.id, userEmail: userProfile.email || subscriptionRecord?.user_email || '', callbackUrl: `${hostUrl}` })
            });
            const result = await apiRes.json();
            if (result.success && result.url) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⭐ *UPGRADE TO PRO PLAN* ⭐\n\nClick the link below to initialize your secure Paystack subscription run:\n\n🔗 ${result.url}`);
            } else {
                throw new Error(result.error || "Gateway timeout.");
            }
        } catch (err) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Checkout Error: ${err.message}`);
        }
        return;
    }

    if (cleanInput === 'withdraw' && availableZar >= 100) {
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚙️ Processing referral request... To finalize banking details, use the withdrawal dashboard panel.`);
        return;
    }

    let menu = `✨ *Hello, ${firstName}!* ${companyName} ✨\nWelcome to your EcoRoute WhatsApp Control Hub.\n\n*MAIN SYSTEM MENU*:\n1. Audit Calculator\n2. Route Checker\n3. Tax Report\n4. Referrals\n5. Fleet Assets\n`;
    if (isFreeTier) menu += `6. Subscribe (R280)\n`;
    menu += `\n🔢 _Reply with a menu number`;
    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, menu);
}
