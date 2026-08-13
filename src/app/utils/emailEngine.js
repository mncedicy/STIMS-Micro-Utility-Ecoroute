// /src/app/utils/emailEngine.js
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey.trim()) : null;

const brevoSmtpHost = process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com";
const brevoSmtpPort = Number(process.env.BREVO_SMTP_PORT || 587);
const brevoSmtpLogin = process.env.BREVO_SMTP_LOGIN || "99f2e0001@smtp-brevo.com";
const brevoSmtpKey = process.env.BREVO_SMTP_KEY;

/**
 * Reusable System Notification Engine with Resend -> Brevo SMTP Failover and Normalized Attachments
 * 
 * @param {Object} options
 * @param {string} options.from - Sender address format e.g. 'Contact Us <contact@stims.co.za>'
 * @param {string|string[]} options.to - Recipient destination email or array of addresses
 * @param {string} options.subject - Subject signature line
 * @param {string} options.html - HTML message string payload body contents
 * @param {Array} [options.attachments] - Optional array of file objects: { filename, content, contentType, path }
 */
export async function sendSystemNotification({ from, to, subject, html, attachments = [] }) {
    if (!to) {
        return { success: false, error: "Missing destination 'to' field parameters." };
    }

    const recipientList = Array.isArray(to) ? to : [to];
    let emailDispatchedSuccessfully = false;

    // ========================================================================
    // CIRCUIT STAGE 1: PRIMARY DISPATCH VIA RESEND API SDK
    // ========================================================================
    if (resend) {
        try {
            console.log(`📡 [Email Engine]: Dispatching message via primary router (Resend)...`);

            const payload = {
                from: from || 'Stims <noreply@stims.co.za>',
                to: recipientList,
                subject: subject,
                html: html
            };

            if (attachments.length > 0) {
                payload.attachments = attachments.map(att => ({
                    filename: att.filename,
                    content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)
                }));
            }

            const { data, error } = await resend.emails.send(payload);

            if (error) throw error;
            emailDispatchedSuccessfully = true;
            console.log(`✅ [Email Engine Success]: Message routed cleanly through Resend. ID: ${data?.id}`);
            return { success: true, provider: 'resend', id: data?.id };
        } catch (resendError) {
            console.warn(`⚠️ [Email Engine Warning]: Resend primary trip exception: "${resendError.message}". Engaging SMTP fallback module...`);
        }
    }

    // ========================================================================
    // CIRCUIT STAGE 2: FALLBACK DISPATCH VIA BREVO SMTP RELAY (NODEMAILER)
    // ========================================================================
    if (!emailDispatchedSuccessfully && brevoSmtpKey) {
        try {
            console.log(`📡 [Email Engine Failover]: Routing message with attachments via Brevo SMTP Relay (${brevoSmtpHost}:${brevoSmtpPort})...`);

            const transporter = nodemailer.createTransport({
                host: brevoSmtpHost,
                port: brevoSmtpPort,
                secure: brevoSmtpPort === 465,
                auth: {
                    user: brevoSmtpLogin,
                    pass: brevoSmtpKey
                }
            });

            const mailOptions = {
                from: from || '"Stims" <noreply@stims.co.za>',
                to: recipientList,
                subject: subject,
                html: html
            };

            // NORMALIZED NODEMAILER ATTACHMENTS: Ensures content is an absolute Buffer 
            // and explicitly defines mime headers so the relay accepts the payload format
            if (attachments.length > 0) {
                mailOptions.attachments = attachments.map(att => ({
                    filename: att.filename,
                    content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
                    contentType: att.contentType || 'application/pdf',
                }));
            }

            const info = await transporter.sendMail(mailOptions);

            emailDispatchedSuccessfully = true;
            console.log(`🎉 [Email Engine Recovery Success]: Successfully handled via Brevo SMTP with attachments. MessageId: ${info.messageId}`);
            return { success: true, provider: 'brevo-smtp', id: info.messageId };
        } catch (smtpError) {
            console.error(`🚨 [Email Engine Total Blackout]: Brevo SMTP fallback transmission error with attachments:`, smtpError.message);
        }
    }

    return {
        success: false,
        error: emailDispatchedSuccessfully ? "Dispatched" : "All delivery routes (Resend and Brevo SMTP) failed to process the request."
    };
}
