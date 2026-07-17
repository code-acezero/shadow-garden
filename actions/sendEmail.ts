'use server'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, username: string) {
  try {
    await resend.emails.send({
      from: 'Shadow Garden <onboarding@resend.dev>', // You can customize this domain later
      to: email,
      subject: 'Welcome to the Shadows',
      html: `<p>Greetings, <strong>${username}</strong>. You have successfully joined the Shadow Garden.</p>`
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}