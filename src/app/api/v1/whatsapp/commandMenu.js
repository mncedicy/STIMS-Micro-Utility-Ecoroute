// src/app/api/v1/whatsapp/commandMenu.js

import { headers } from 'next/headers';
import { sendMetaWhatsappMessage } from './metaClient';

export async function displayWhatsappMainMenu({
    incomingMessage,
    userProfile,
    tokenRecord,
    availableBalanceCents = 0,
    customVehicles = [],
    businessPhoneNumberId,
    cleanPhoneNumber
}) {
    const cleanInput = String(incomingMessage || '').trim().toLowerCase();
    const currentSubStatus = String(tokenRecord?.status || 'free').toLowerCase();
    const isFreeTier = !['active', 'premium', 'pro'].includes(currentSubStatus);
    const firstName = userProfile?.first_name || 'Partner';
    const companyName = userProfile?.company ? ` (${userProfile.company})` : '';
    const availableZar = availableBalanceCents / 100;

    if (cleanInput === '1') {
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
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber,
            `🗺️ *2. ROUTE CHECKER RUNS* \n\n` +
            `To track a terrestrial matrix array trace path, use the dashboard tracker panel or pass parameters via API integrations.\n\n` +
            `💡 *Command Format Examples*:\n` +
            `• _vehicle 45km [vehicle_id]_\n` +
            `• _vehicle 120miles [vehicle_id]_`
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
                const reg = (veh.registration_number || veh.registration || 'FLEET').toUpperCase();
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
            // FIXED: Dynamically read the incoming request headers securely from the server thread context
            const headersList = await headers();
            const host = headersList.get('host') || 'ecoroute.stims.co.za';
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
            const hostUrl = `${protocol}://${host}`;

            const apiRes = await fetch(`${hostUrl}/api/checkout/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userProfile.id,
                    userEmail: userProfile.email || tokenRecord.user_email || '',
                    callbackUrl: `${hostUrl}/dashboard`
                })
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
