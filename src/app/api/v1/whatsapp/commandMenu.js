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
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'INSIDE_CALCULATOR_SUBMENU', updated_at: new Date().toISOString() }).eq('id', tokenRecord.id);
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

    if (cleanInput === '2') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_ROUTE_DISTANCE', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `🗺️ *2. ROUTE CHECKER WIZARD RUN* \n\n` +
            `Please type the terrestrial distance path length to verify tracking optimizations:\n\n` +
            `*ROUTE TOTAL DISTANCE (KM)*`
        );
        return;
    }

    // FIXED: Intercept selection '3' to lock state on the tax wizard period options selection prompt layout menu
    if (cleanInput === '3') {
        await supabaseAdmin
            .from('ecoroute_corporate_api_tokens')
            .update({ current_whatsapp_state: 'AWAITING_TAX_PERIOD', pending_whatsapp_payload: {} })
            .eq('id', tokenRecord.id);

        const taxOptionsPrompt =
            `🏛️ *3. STATUTORY TAX REPORT PERIODS* 🏛️\n\n` +
            `Select a window frame by replying with an option number:\n\n` +
            `*1* — One month\n` +
            `*2* — Three Months\n` +
            `*3* — Six Months\n` +
            `*4* — 12 Months\n` +
            `*5* — Current Tax Year\n` +
            `*6* — Previous Tax Year\n\n` +
            `💡 _Or reply with 'menu' to return to system controls._`;

        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, taxOptionsPrompt);
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
                body: JSON.stringify({ userId: userProfile.id, userEmail: userProfile.email || '', callbackUrl: `${hostUrl}` })
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
