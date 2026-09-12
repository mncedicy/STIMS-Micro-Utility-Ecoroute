// File Location: src/app/api/v1/whatsapp/security.js

import crypto from 'crypto';

export function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret || !signatureHeader) {
        return false;
    }

    const elements = signatureHeader.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

    return signatureHash === expectedHash;
}