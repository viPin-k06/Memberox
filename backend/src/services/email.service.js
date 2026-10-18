import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTestEmail(to) {
  const { data, error } = await resend.emails.send({
    from: "Memberox <onboarding@resend.dev>",
    to: [to],
    subject: "Memberox Email Integration Test",
    html: `
      <h2>Memberox Email Test</h2>
      <p>Your email integration is working!</p>
      <p>Membership expiry reminders will be sent automatically once configured.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
