import { Resend } from "resend";

const EMAIL_MODE = process.env.EMAIL_MODE || "simulate";

export async function sendReminderEmail({
  to,
  memberName,
  gymName,
  expiryDate,
}) {
  if (!to) {
    throw new Error("Member email address is missing");
  }

  const subject = `Membership Expiry Reminder - ${gymName}`;

  const message = `
    <h2>Membership Expiry Reminder</h2>

    <p>Hi ${escapeHtml(memberName)},</p>

    <p>
      Your membership at <strong>${escapeHtml(gymName)}</strong>
      is scheduled to expire on
      <strong>${escapeHtml(expiryDate)}</strong>.
    </p>

    <p>
      Please contact your gym to renew your membership.
    </p>

    <p>Thank you,<br>${escapeHtml(gymName)}</p>
  `;

  // Development mode: no real email is sent.
  if (EMAIL_MODE === "simulate") {
    console.log("[EMAIL SIMULATED]", {
      to,
      subject,
      expiryDate,
    });

    return {
      status: "simulated",
      providerMessageId: null,
    };
  }

  if (EMAIL_MODE !== "live") {
    throw new Error(`Invalid EMAIL_MODE: ${EMAIL_MODE}`);
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Resend email configuration is missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject,
    html: message,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    status: "sent",
    providerMessageId: data.id,
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}
