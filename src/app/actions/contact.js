// app/actions/contact.js
"use server";

import { createClient } from '@supabase/supabase-js';
import { sendSystemNotification } from '../utils/emailEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const destinationEmail = process.env.FORWARD_DESTINATION_EMAIL;

export async function dispatchTransmission(formData) {
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const queue = formData.get("queue")?.toString();
    const tool = formData.get("tool")?.toString();
    const message = formData.get("message")?.toString().trim();

    if (!name || !email || !message) {
        return { success: false, error: "Please fill out all required fields." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: "Your email address is not valid." };
    }

    try {
        // 1. Save record to Supabase
        const { error: dbError } = await supabase
            .from('contacts')
            .insert([{
                name,
                email,
                channel_queue: queue,
                selected_tool: tool || "None",
                message,
                created_at: new Date().toISOString()
            }]);

        if (dbError) throw dbError;

        // 2. Dispatch via our reusable email engine module
        if (destinationEmail) {
            await sendSystemNotification({
                from: 'Contact Us <contact@stims.co.za>',
                to: [destinationEmail],
                subject: `New Message: ${queue || 'General Inquiry'}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e293b; background-color: #020617; color: #94a3b8;">
                        <h2 style="color: #ffffff;">New Message Received</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Topic:</strong> ${queue || 'None'}</p>
                        <p><strong>Selected Tool:</strong> ${tool || "None"}</p>
                        <p style="margin-top: 20px; color: #ffffff;"><strong>Message:</strong></p>
                        <p>${message.replace(/\n/g, '<br/>')}</p>
                    </div>
                `
            });
        }

        return { success: true, message: "Your message was sent successfully!" };
    } catch (err) {
        console.error("🚨 Dispatch Transmission Error:", err);
        return { success: false, error: "Something went wrong. Please try again later." };
    }
}
