import crypto from "node:crypto";
import { supabaseAdmin } from "../_supabaseAdmin.js";

// Mercado Pago webhook: validates signature, fetches the resource, and updates
// subscriptions / invoices / payments + tenant billing status.
const MP = process.env.MP_ACCESS_TOKEN;
const SECRET = process.env.MP_WEBHOOK_SECRET;

function validSignature(req: any, dataId: string): boolean {
  if (!SECRET) return true; // not configured -> skip (dev)
  const sig = (req.headers["x-signature"] || "").toString();
  const reqId = (req.headers["x-request-id"] || "").toString();
  const parts: Record<string, string> = {};
  sig.split(",").forEach((kv) => {
    const [k, v] = kv.split("=").map((s) => s.trim());
    if (k && v) parts[k] = v;
  });
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${reqId};ts:${parts.ts};`;
  const h = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const type = (req.query?.type || req.body?.type || req.query?.topic || "").toString();
    const dataId = (req.query?.["data.id"] || req.body?.data?.id || req.query?.id || "").toString();
    if (!dataId) return res.status(200).json({ ok: true, ignored: true });
    if (!validSignature(req, dataId)) return res.status(401).json({ error: "assinatura inválida" });

    if (type.includes("preapproval") || type.includes("subscription")) {
      const r = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, { headers: { Authorization: `Bearer ${MP}` } });
      const pre = await r.json().catch(() => ({}));
      const tenantId = pre.external_reference;
      const status = pre.status;
      if (tenantId) {
        await supabaseAdmin.from("subscriptions").update({ status, updated_at: new Date().toISOString() }).eq("mp_preapproval_id", dataId);
        if (status === "authorized") {
          await supabaseAdmin.from("tenants").update({ status: "active", past_due_since: null }).eq("id", tenantId);
        } else if (status === "paused") {
          await supabaseAdmin.from("tenants").update({ status: "past_due", past_due_since: new Date().toISOString() }).eq("id", tenantId);
        } else if (status === "cancelled") {
          await supabaseAdmin.from("tenants").update({ status: "canceled" }).eq("id", tenantId);
        }
      }
    } else if (type.includes("payment")) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, { headers: { Authorization: `Bearer ${MP}` } });
      const pay = await r.json().catch(() => ({}));
      let tenantId = pay.external_reference;
      // Fallback: recurring payments may omit external_reference -> map via subscription.
      if (!tenantId) {
        const preId = pay.metadata?.preapproval_id || pay.preapproval_id;
        if (preId) {
          const { data: sub } = await supabaseAdmin.from("subscriptions").select("tenant_id").eq("mp_preapproval_id", preId).maybeSingle();
          tenantId = sub?.tenant_id;
        }
      }
      if (tenantId) {
        const cents = Math.round((pay.transaction_amount || 0) * 100);
        // idempotent on mp_payment_id (MP re-sends notifications)
        await supabaseAdmin.from("payments").upsert(
          { tenant_id: tenantId, amount_cents: cents, status: pay.status, mp_payment_id: String(pay.id), method: pay.payment_method_id },
          { onConflict: "mp_payment_id" },
        );
        if (pay.status === "approved") {
          // settle an existing open invoice; if none, record a paid one (idempotent)
          const { data: settled } = await supabaseAdmin
            .from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString(), mp_payment_id: String(pay.id) })
            .eq("tenant_id", tenantId).eq("status", "open").select("id");
          if (!settled || settled.length === 0) {
            await supabaseAdmin.from("invoices").upsert(
              { tenant_id: tenantId, amount_cents: cents, status: "paid", paid_at: new Date().toISOString(), mp_payment_id: String(pay.id) },
              { onConflict: "mp_payment_id" },
            );
          }
          await supabaseAdmin.from("tenants").update({ status: "active", past_due_since: null }).eq("id", tenantId);
        }
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("mp webhook error", e);
    return res.status(200).json({ ok: false }); // 200 avoids MP retry storms; logged for debug
  }
}
