import { supabaseAdmin, hasAdmin } from "../_supabaseAdmin.js";

// Creates a Mercado Pago preapproval (recurring subscription) for the caller's
// tenant + plan and returns the checkout init_point.
const MP = process.env.MP_ACCESS_TOKEN;
const APP_URL = process.env.APP_URL || "https://finance.vance.expert";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  if (!MP) return res.status(400).json({ error: "MP_ACCESS_TOKEN não configurado no servidor." });
  if (!hasAdmin) return res.status(400).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurado no servidor." });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Não autenticado." });

  try {
    const { data: u } = await supabaseAdmin.auth.getUser(token);
    const user = u?.user;
    if (!user) return res.status(401).json({ error: "Sessão inválida." });

    const { data: prof } = await supabaseAdmin.from("profiles").select("tenant_id,role").eq("id", user.id).single();
    if (!prof?.tenant_id) return res.status(400).json({ error: "Tenant não encontrado." });
    if (prof.role !== "admin") return res.status(403).json({ error: "Apenas administradores podem assinar." });

    const { data: tenant } = await supabaseAdmin
      .from("tenants").select("id,name,plan_id, plan:plans(id,code,name,price_cents)").eq("id", prof.tenant_id).single();
    let plan: any = Array.isArray((tenant as any).plan) ? (tenant as any).plan[0] : (tenant as any).plan;
    const bodyPlan = (req.body?.plan || "").toString();
    if (bodyPlan) {
      const { data: p } = await supabaseAdmin.from("plans").select("id,code,name,price_cents").eq("code", bodyPlan).single();
      if (p) plan = p;
    }
    if (!plan) return res.status(400).json({ error: "Plano inválido." });

    const mpResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${MP}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `Vance Expert — Plano ${plan.name}`,
        external_reference: tenant.id,
        payer_email: user.email,
        back_url: APP_URL,
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: (plan.price_cents || 0) / 100, currency_id: "BRL" },
        status: "pending",
      }),
    });
    const mp = await mpResp.json().catch(() => ({}));
    if (!mpResp.ok) return res.status(502).json({ error: mp?.message || "Falha ao criar assinatura no Mercado Pago.", detail: mp });

    await supabaseAdmin.from("subscriptions").insert({ tenant_id: tenant.id, plan_id: plan.id, status: "pending", mp_preapproval_id: mp.id });
    await supabaseAdmin.from("tenants").update({ plan_id: plan.id }).eq("id", tenant.id);

    return res.status(200).json({ init_point: mp.init_point || mp.sandbox_init_point, preapprovalId: mp.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Erro ao criar assinatura." });
  }
}
