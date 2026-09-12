// src/app/api/v1/whatsapp/metaClient.js

export async function sendMetaWhatsappMessage(phoneId, recipientMobile, messageStringText) {
    // const metaCloudAccessToken = process.env.WHATSAPP_META_ACCESS_TOKEN || '';
    const metaCloudAccessToken = "EAAXr1581WfABSWdvZCYbghkPwDUCiDVXZAHTv4lNdB1C3ExLz8KVeSHls3IS6k2tMFZCAgXpSNDduSZBiX5ddqRx5HTBTPMoe8IgVhhcOmOUFYN5n3OfOHU1xGOUtmoZCpUA1am0UTIVMS7xDOod5hAHIFQNQZANPK72uVJJFpNsitjSZBb1U6icr4LxlYBNeR72WamrmoZChAznKsWpV2vIQg4aBM7LyhK5RKlWtYw3R2Ujn0nR9jSZCjVYGUKQSTViPFefqFeMYZCjqEhxUJydp3J63JQ6ENDdaItgZDZD";
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
