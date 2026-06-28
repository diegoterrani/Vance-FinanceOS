// Transactional email via Resend (RESEND_KEY). Verify the sender domain in
// Resend (e.g. vance.expert) so messages aren't rejected.
const RESEND_KEY = process.env.RESEND_KEY;
const FROM = process.env.MAIL_FROM || "Vance Expert <no-reply@vance.expert>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return { ok: false, skipped: true };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}

export function emailShell(title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
    <h2 style="font-weight:800">${title}</h2>
    <div style="font-size:14px;line-height:1.6;color:#333">${body}</div>
    <p style="font-size:11px;color:#999;margin-top:24px">Vance Expert · Iron Security</p>
  </div>`;
}
