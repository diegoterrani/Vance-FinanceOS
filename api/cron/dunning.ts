import { supabaseAdmin, hasAdmin } from "../_supabaseAdmin.js";
import { sendEmail, emailShell } from "../_email.js";

// Daily dunning job (Vercel Cron). Trials past expiry -> past_due; past_due
// beyond grace -> suspended. Sends notices via Resend.
const GRACE_DAYS = 5;
const APP_URL = process.env.APP_URL || "https://finance.vance.expert";
const CRON_SECRET = process.env.CRON_SECRET;

async function ownerEmail(ownerId: string | null): Promise<string | null> {
  if (!ownerId) return null;
  const { data } = await supabaseAdmin.from("profiles").select("email").eq("id", ownerId).single();
  return data?.email || null;
}

export default async function handler(req: any, res: any) {
  if (CRON_SECRET) {
    const auth = (req.headers.authorization || "").toString();
    if (auth !== `Bearer ${CRON_SECRET}`) return res.status(401).json({ error: "unauthorized" });
  }
  if (!hasAdmin) return res.status(400).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurado." });

  const now = Date.now();
  let trialsExpired = 0;
  let suspended = 0;

  const { data: trials } = await supabaseAdmin
    .from("tenants").select("id,name,trial_ends_at,owner_id").eq("status", "trialing");
  for (const t of trials || []) {
    if (t.trial_ends_at && new Date(t.trial_ends_at).getTime() < now) {
      await supabaseAdmin.from("tenants").update({ status: "past_due", past_due_since: new Date().toISOString() }).eq("id", t.id);
      trialsExpired++;
      const email = await ownerEmail(t.owner_id);
      if (email) await sendEmail(email, "Seu trial do Vance Expert terminou",
        emailShell("Trial encerrado", `Seu período de avaliação acabou. Assine para continuar usando o Vance Expert:<br><a href="${APP_URL}">${APP_URL}</a>`));
    }
  }

  const { data: due } = await supabaseAdmin
    .from("tenants").select("id,name,past_due_since,owner_id").eq("status", "past_due");
  for (const t of due || []) {
    if (t.past_due_since && now - new Date(t.past_due_since).getTime() > GRACE_DAYS * 86400000) {
      await supabaseAdmin.from("tenants").update({ status: "suspended" }).eq("id", t.id);
      suspended++;
      const email = await ownerEmail(t.owner_id);
      if (email) await sendEmail(email, "Acesso suspenso — Vance Expert",
        emailShell("Assinatura suspensa", `Sua conta foi suspensa por pendência de pagamento. Regularize para reativar:<br><a href="${APP_URL}">${APP_URL}</a>`));
    }
  }

  return res.status(200).json({ ok: true, trialsExpired, suspended });
}
