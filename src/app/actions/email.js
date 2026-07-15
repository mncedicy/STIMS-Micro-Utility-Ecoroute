"use server";

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const destinationEmail = process.env.FORWARD_DESTINATION_EMAIL;

/**
 * Securely emails carbon reports with an attached text document straight to the user
 */
export async function emailPdfReport(userEmail, logId, categoryDisplay, pdfBase64Data) {
    if (!resend) {
        return { success: false, error: "Email delivery system is not configured." };
    }

    const finalTargetEmailAddress = destinationEmail || userEmail;

    if (!finalTargetEmailAddress) {
        return { success: false, error: "No target email address has been provided." };
    }

    try {
        const emailPayload = {
            from: 'STIMS EcoRoute <onboarding@resend.dev>',
            to: [finalTargetEmailAddress.trim().toLowerCase()],
            subject: `EcoRoute Carbon Audit Report: Log ${logId.substring(0, 8)}`,
            html: `
                <div style="font-family: monospace; padding: 24px; border: 1px solid #1e293b; background-color: #020617; color: #94a3b8; max-width: 600px; margin: 0 auto; border-radius: 8px;">
                    <h2 style="color: #3b82f6; margin-bottom: 4px; text-transform: uppercase;">STIMS EcoRoute Report</h2>
                    <p style="font-size: 11px; color: #64748b; margin-bottom: 24px;">Official Certified Carbon Emissions Record</p>
                    
                    <div style="border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
                        <p style="margin: 4px 0;"><strong style="color: #ffffff;">Log Identifier:</strong> ${logId}</p>
                        <p style="margin: 4px 0;"><strong style="color: #ffffff;">Assessment Class:</strong> ${categoryDisplay}</p>
                        <p style="margin: 4px 0;"><strong style="color: #ffffff;">Generated At:</strong> ${new Date().toLocaleString('en-ZA')}</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #e2e8f0;">
                        Your official carbon audit certificate has been compiled and attached to this email as a clean data document file.
                    </p>
                    
                    <p style="font-size: 10px; color: #475569; text-align: center; border-top: 1px dashed #1e293b; padding-top: 12px; margin-top: 24px;">
                        This email was generated automatically by ecoroute.stims.co.za.
                    </p>
                </div>
            `
        };

        if (pdfBase64Data) {
            emailPayload.attachments = [
                {
                    // FIXED: Changed extension parameters from .pdf to .txt to stop document parsing errors
                    filename: `ecoroute_audit_${logId.substring(0, 8)}.txt`,
                    content: pdfBase64Data
                }
            ];
        }

        await resend.emails.send(emailPayload);
        return { success: true, message: "The report text file has been emailed successfully!" };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message || "Failed to deliver the email report." };
    }
}
