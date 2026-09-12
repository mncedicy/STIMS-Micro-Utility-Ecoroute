// File Location: src/app/api/v1/whatsapp/metaClient.js

export async function sendMetaWhatsappMessage(phoneId, recipientMobile, messageStringText) {
    // HARDCODED ACCESS TOKEN FOR TESTING
    const metaCloudAccessToken = "EAAXr1581WfABSaO3kXMx8tq4B4pymZCeogPpfhiB8fEyjovWSZCLA0xSBuXEl3nndshAFQ6EIMiKZAYWfg5Xf9dJ7x2RtUyEo0JTlCZBa07CFv3ztJoTrjs3RpHNHj4bKtfQyeWRycZBA9fe8WyhFt5iCfQv0Gri9SBJ2dBJzJqOqL4osEXIMZCJDLIZCAicAZDZD";
    const activePhoneId = phoneId || "1307900412406936";
    const graphApiVersionUrl = `https://graph.facebook.com/v22.0/${activePhoneId}/messages`;

    if (!metaCloudAccessToken || !activePhoneId) {
        console.error(`⚠️ [Meta Client Fault]: Missing access token or phoneId. phoneId=${activePhoneId}, tokenExists=${!!metaCloudAccessToken}`);
        return;
    }

    try {
        const response = await fetch(graphApiVersionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${metaCloudAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipientMobile,
                type: 'text',
                text: { preview_url: false, body: messageStringText }
            })
        });

        const resData = await response.json();
        if (!response.ok) {
            console.error('🚨 [Meta Graph API Error]:', JSON.stringify(resData));
        } else {
            console.log('✅ [WhatsApp Reply Sent]:', resData);
        }
    } catch (fetchNetworkError) {
        console.error('🚨 [Meta Graph HTTP Post Fail]:', fetchNetworkError.message);
    }
}