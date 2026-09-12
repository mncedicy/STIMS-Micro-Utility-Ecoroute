// File Location: src/app/api/v1/whatsapp/security.js

import crypto from 'crypto';

export function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // TEMPORARY: If APP_SECRET is missing in env, log a warning & allow sandbox testing
    if (!appSecret) {
        console.warn('⚠️ WHATSAPP_APP_SECRET environment variable is missing. Bypassing signature check for test.');
        return true;
    }

    if (!signatureHeader) {
        console.warn('⚠️ Missing x-hub-signature-256 header.');
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
        console.warn(`❌ Signature Mismatch. Expected ${expectedHash}, got ${signatureHash}`);
    }

    return isValid;
}