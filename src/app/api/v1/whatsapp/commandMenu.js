// src/app/api/v1/whatsapp/commandMenu.js

import { sendMetaWhatsappMessage, sendMetaInteractiveMessage } from './metaClient';

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

    // =========================================================================
    // MAP INTERACTIVE CALLBACK ID ACTIONS BACK TO LEGACY VALUES FOR STABILITY
    // =========================================================================
    if (cleanInput === 'menu_option_1' || cleanInput === '1') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'INSIDE_CALCULATOR_SUBMENU', updated_at: new Date().toISOString() }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `📊 *1. AUDIT CALCULATOR SUB-MENU* \n\n1 Vehicle\n2 Shipping\n3 Flight\n4 Electricity\n5 Gas`);
        return;
    }

    if (cleanInput === 'menu_option_2' || cleanInput === '2') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_ROUTE_DISTANCE', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `🗺️ *2. ROUTE CHECKER WIZARD RUN* \n\nPlease type the terrestrial distance path length:\n\n*ROUTE TOTAL DISTANCE (KM)*`);
        return;
    }

    if (cleanInput === 'menu_option_3' || cleanInput === '3') {
        await supabaseAdmin.from('ecoroute_corporate_api_tokens').update({ current_whatsapp_state: 'AWAITING_TAX_PERIOD', pending_whatsapp_payload: {} }).eq('id', tokenRecord.id);
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `🏛️ *3. STATUTORY TAX REPORT PERIODS* 🏛️\n\nSelect a window frame:\n*1* — One month\n*2* — Three Months\n*3* — Six Months\n*4* — 12 Months\n*5* — Current Tax Year\n*6* — Previous Tax Year`);
        return;
    }

    if (cleanInput === 'menu_option_4' || cleanInput === '4') {
        let text = `💰 *4. REFERRALS EARNING BASES* 💰\n\n• Unpaid Wallet Balance: *R${availableZar.toFixed(2)} ZAR*\n\n`;
        text += availableZar >= 100 ? `👉 *Reply with "withdraw"* to trigger cashout.` : `ℹ️ _Note: A minimum of R100.00 is required to trigger cashout._`;
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, text);
        return;
    }

    if (cleanInput === 'menu_option_5' || cleanInput === '5') {
        let text = `🚛 *5. REGISTERED FLEET ASSET NODES* \n\n`;
        if (customVehicles.length > 0) {
            customVehicles.forEach((veh) => {
                text += `• ${String(veh.registration_number || 'FLEET').toUpperCase()} - ${String(veh.make || 'ASSET').toUpperCase()}\n`;
            });
        } else {
            text += `ℹ️ No active fleet assets linked to your corporate sustainability profiles.`;
        }
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, text);
        return;
    }

    if (cleanInput === 'menu_option_6' || cleanInput === '6') {
        if (!isFreeTier) return;
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⏳ Connecting to checkout gateways...`);
        try {
            const hostUrl = incomingServerUrl || 'https://stims.co.za';
            const apiRes = await fetch(`${hostUrl}/api/checkout/initialize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userProfile.id, userEmail: userProfile.email || '', callbackUrl: `${hostUrl}` }) });
            const result = await apiRes.json();
            if (result.success && result.url) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⭐ *UPGRADE TO PRO PLAN* ⭐\n\n🔗 ${result.url}`);
            } else {
                throw new Error(result.error || "Gateway timeout.");
            }
        } catch (err) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `❌ Checkout Error: ${err.message}`);
        }
        return;
    }

    // =========================================================================
    // NATIVE UI COMPONENTS: RENDER THE LIST SELECTION PANEL IF UNMATCHED
    // =========================================================================
    const rowsArray = [
        { id: "menu_option_1", title: "📊 Audit Calculator", description: "Compute Scope 1 & 2 emissions vectors" },
        { id: "menu_option_2", title: "🗺️ Route Checker", description: "Track optimized terrestrial travel paths" },
        { id: "menu_option_3", title: "🏛️ Tax Report", description: "Extract statutory SARS carbon compliance cards" },
        { id: "menu_option_4", title: "💰 Referrals Ledger", description: "Inspect accumulated unpaid referral wallet values" },
        { id: "menu_option_5", title: "🚛 Fleet Assets", description: "View registered vehicle node matrices" }
    ];

    if (isFreeTier) {
        rowsArray.push({ id: "menu_option_6", title: "⭐ Subscribe Pro Plan", description: "Unlock premium corporate resource limits" });
    }

    const nativeListPayload = {
        type: "list",
        header: { type: "text", text: `✨ Hello, ${firstName}! ✨` },
        body: { text: `Welcome to EcoRoute${companyName}.\nSelect an operation from the panel to manage your system settings.` },
        footer: { text: "EcoRoute Multi-Tenant Platform Engine" },
        action: {
            button: "Open System Menu",
            sections: [
                {
                    title: "MAIN WORKSPACE CONTROLS",
                    rows: rowsArray
                }
            ]
        }
    };

    console.log(`📡 Dispatching native Meta interactive list menu component block to phone user.`);
    await sendMetaInteractiveMessage(businessPhoneNumberId, cleanPhoneNumber, nativeListPayload);
}
