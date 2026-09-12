// src/app/api/v1/whatsapp/security.js

import crypto from 'crypto';

/**
 * Validates that an incoming payload genuinely originated from Meta Graph servers
 * by comparing the X-Hub-Signature-256 header against a local SHA256 HMAC hash.
 * 
 * @param {string} rawBodyString - The unparsed, raw text body stream from the request.
 * @param {string} signatureHeader - The content of the request's 'x-hub-signature-256' header.
 * @returns {boolean} True if the calculated signature matches Meta's header perfectly.
 */
export function verifyMetaWebhookSignature(rawBodyString, signatureHeader) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Fail immediately if security credentials are missing or signature is omitted
    if (!appSecret || !signatureHeader) {
        console.warn('⚠️ [Webhook Security Alert]: Validation bypassed due to missing context.');
        return false;
    }

    try {
        // Meta header format example: 'sha256=abcdef123456...'
        const elements = signatureHeader.split('=');
        const signatureHash = elements[1];

        if (!signatureHash) return false;

        // Calculate a cryptographically secure SHA256 HMAC using your App Secret signature
        const calculatedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(rawBodyString, 'utf-8')
            .digest('hex');

        // Use timingSafeEqual to guard against advanced timing side-channel attacks
        return crypto.timingSafeEqual(
            Buffer.from(calculatedSignature, 'utf-8'),
            Buffer.from(signatureHash, 'utf-8')
        );
    } catch (err) {
        console.error('🚨 [Cryptographic Security Fault]:', err.message);
        return false;
    }
}
