// File Location: src/app/api/v1/whatsapp/commandMenu.js

import { sendMetaWhatsappMessage } from './metaClient';

/**
 * Greets an authenticated operator nicely by name and renders the custom structural system menu options.
 *
 * @param {string} businessPhoneNumberId - Meta target node configuration ID.
 * @param {string} cleanPhoneNumber - Destination customer mobile address sequence.
 * @param {Object} userProfile - Database profile entity block container.
 */
export async function displayWhatsappMainMenu(businessPhoneNumberId, cleanPhoneNumber, userProfile = {}) {
    const dynamicMainMenuPrompt =
        `✨ *Hello, ${userProfile.first_name || 'Partner'}!* ✨\n` +
        `Welcome to your EcoRoute WhatsApp Control Hub.\n\n` +
        `*MAIN SYSTEM MENU*:\n` +
        `1. Audit Calculator\n` +
        `2. Route Checker\n` +
        `3. Tax Report\n` +
        `4. referralS\n` +
        `5. FLEET ASSETS\n\n` +
        `💡 *Quick Audit Commands Examples*:\n` +
        `• _vehicle 45km [id]_\n` +
        `• _flight 2 pax jnb cpt business_\n` +
        `• _power 350 za utility_grid_\n` +
        `• _shipping 10 tonnes 400 km rail_\n` +
        `• _gas 80 lpg kg_`;

    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, dynamicMainMenuPrompt);
}
