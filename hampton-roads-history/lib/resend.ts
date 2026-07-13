import { Resend } from "resend";

let client: Resend | undefined;

function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    client = new Resend(apiKey);
  }
  return client;
}

const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || "onboarding@resend.dev";
const CORRECTIONS_EMAIL = process.env.CORRECTIONS_EMAIL || "corrections@hamptonroadshistory.com";
const SITE_NAME = "Hampton Roads History";

export async function sendConfirmationEmail(email: string, confirmToken: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const confirmUrl = `${siteUrl}/newsletter/confirm?token=${confirmToken}`;

  const resend = getResendClient();
  return resend.emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "Confirm your subscription to Hampton Roads History",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
        <h1 style="font-size: 20px; color: #12140f;">One more step</h1>
        <p style="color: #4a4a42; line-height: 1.6;">
          Confirm your email to start receiving the morning dispatch —
          one flagship story and a few quick reads from across Hampton
          Roads, weekday mornings.
        </p>
        <a href="${confirmUrl}"
           style="display: inline-block; background: #d1543b; color: white;
                  padding: 12px 24px; border-radius: 999px; text-decoration: none;
                  font-weight: 600; margin-top: 16px;">
          Confirm subscription
        </a>
        <p style="color: #8a8a80; font-size: 13px; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// WS-20: forwards a reader-submitted correction report to the editorial
// team's inbox for review. Deliberately not persisted to the database — the
// public corrections log (hr_corrections) is staff-authored only, after a
// human reviews the report, matching the editorial-standards promise on the
// About page ("we review every report and post corrections at the bottom
// of the affected story").
export async function sendCorrectionReport(
  articleTitle: string,
  articleUrl: string,
  description: string,
  reporterEmail?: string
) {
  const resend = getResendClient();
  return resend.emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: CORRECTIONS_EMAIL,
    replyTo: reporterEmail || undefined,
    subject: `Correction report: ${articleTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
        <h1 style="font-size: 20px; color: #12140f;">Correction reported</h1>
        <p style="color: #4a4a42; line-height: 1.6;">
          <strong>Story:</strong> <a href="${articleUrl}">${articleTitle}</a>
        </p>
        <p style="color: #4a4a42; line-height: 1.6; white-space: pre-wrap;">${description}</p>
        ${reporterEmail ? `<p style="color: #8a8a80; font-size: 13px;">Reported by: ${reporterEmail}</p>` : ""}
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, unsubscribeToken: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const resend = getResendClient();
  return resend.emails.send({
    from: `${SITE_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "You're subscribed to Hampton Roads History",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
        <h1 style="font-size: 20px; color: #12140f;">Welcome aboard</h1>
        <p style="color: #4a4a42; line-height: 1.6;">
          You're all set. Look for the morning dispatch in your inbox on
          weekdays — one flagship story and a few quick reads from
          Hampton, Newport News, Norfolk, Virginia Beach, Chesapeake,
          Portsmouth, and Suffolk.
        </p>
        <p style="color: #8a8a80; font-size: 13px; margin-top: 32px;">
          <a href="${unsubscribeUrl}" style="color: #8a8a80;">Unsubscribe</a> at any time.
        </p>
      </div>
    `,
  });
}
