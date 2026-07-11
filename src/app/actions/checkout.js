// src/app/actions/checkout.js
"use server";

export async function generatePaymentLink(userId, userEmail, priceInCents) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        return { success: false, error: "Gateway Error: PAYSTACK_SECRET_KEY is missing from EcoRoute .env.local file." };
    }

    try {
        const payload = {
            email: userEmail.trim().toLowerCase(),
            amount: Math.round(priceInCents),
            currency: "ZAR",
            // Redirects the user's browser straight back to EcoRoute root port 3001
            callback_url: `http://localhost:3001/?stims_app_id=ecoroute`,
            metadata: {
                user_id: userId,
                app_id: "ecoroute",
                tier: "premium"
            }
        };

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        const result = await response.json();
        if (!result.status) throw new Error(result.message || "Initialization rejected.");

        return { success: true, url: result.data.authorization_url };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
