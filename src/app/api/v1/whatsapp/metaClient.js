// src/app/api/v1/whatsapp/metaClient.js

export async function sendMetaWhatsappMessage(phoneId, recipientMobile, messageStringText) {
    const metaCloudAccessToken = 'EAAXr1581WfABSe9oPIEXie4cfyc33M4FckNIsJf51NEXrQZCttcjynricdFMz5Ta8bBQClZB6uoNPnq0AoUoZAVo1WMjWZBZAo0RJweLSH1tSLIicIsJaPPBPLcyOhVGZCgZBrxk4GAkyvy5ZBMaoHZBpAs0ZBErCoigA1raSdZBDwSVcGvqnWggQBlaJlYW0FsYMBiXPFeCxQEZAA0cg1kb3CZBVvlZCMo6UtQVftmo3AxsPZBWYPwFK52aWcMBxVntZBvoZCUmhiZBNNhcR4b2W8smxkbr9pZAEQZCR5JodfW7ZAQZDZD';
    const graphApiVersionUrl = `https://graph.facebook.com/v25.0/${phoneId}/messages`;

    if (!metaCloudAccessToken || !phoneId) {
        console.warn('⚠️ [Meta Interface Link Fault]: Missing configuration token values.');
        return;
    }

    try {
        await fetch(graphApiVersionUrl, {
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
    } catch (fetchNetworkError) {
        console.error('🚨 [Meta Graph HTTP Post Fail]:', fetchNetworkError.message);
    }
}
