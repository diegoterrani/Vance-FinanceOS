// Self-service signup. If SUPABASE_SERVICE_ROLE_KEY is set, creates the user
// already e-mail-confirmed (instant trial, no inbox needed). The DB trigger
// provisions an isolated tenant. If the key is absent, returns autoConfirmed:false
// so the client falls back to normal signUp (which may require email confirmation).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  const { email, password, name, companyName, plan } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  if (String(password).length < 6) return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });

  const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const URL = process.env.SUPABASE_URL || "https://gltffiwkzdvsxruexklw.supabase.co";
  if (!SR) return res.status(200).json({ autoConfirmed: false, reason: "service-role-not-configured" });

  try {
    const r = await fetch(`${URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email).toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name, company_name: companyName, plan: plan || "starter", role: "admin" },
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (j?.msg || j?.error_description || j?.error || "").toString();
      if (/registered|already|exists/i.test(msg)) return res.status(409).json({ error: "Este e-mail já está em uso." });
      return res.status(502).json({ error: msg || "Falha ao criar a conta." });
    }
    return res.status(200).json({ autoConfirmed: true, userId: j?.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Erro no cadastro." });
  }
}
