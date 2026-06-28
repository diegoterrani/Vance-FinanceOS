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
      const tenantId = pay.external_reference;
      if (tenantId) {
        const cents = Math.round((pay.transaction_amount || 0) * 100);
        await supabaseAdmin.from("payments").insert({ tenant_id: tenantId, amount_cents: cents, status: pay.status, mp_payment_id: String(pay.id), method: pay.payment_method_id });
        if (pay.status === "approved") {
          await supabaseAdmin.from("invoices").insert({ tenant_id: tenantId, amount_cents: cents, status: "paid", paid_at: new Date().toISOString(), mp_payment_id: String(pay.id) });
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
