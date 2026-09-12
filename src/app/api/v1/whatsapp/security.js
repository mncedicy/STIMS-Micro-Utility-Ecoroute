// File Location: src/app/api/v1/whatsapp/security.js

import crypto from 'crypto';

export function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
        console.warn('⚠️ [Security]: WHATSAPP_APP_SECRET environment variable is not set. Bypassing check for testing.');
        return true;
    }

    if (!signatureHeader) {
        console.warn('⚠️ [Security]: Request missing x-hub-signature-256 header.');
        return false;
    }

    const elements = signatureHeader.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

    const isValid = signatureHash === expectedHash;
    if (!isValid) {
        console.warn(`❌ [Security Mismatch]: Expected ${expectedHash}, received ${signatureHash}`);
    }

    return isValid;
}