// Real Pluggy integration: mints a connect token used by the Pluggy Connect
// widget to let a user link their bank account (Open Finance aggregation).
// Activates once PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET are set in Vercel.
// Register a free app at https://dashboard.pluggy.ai to obtain credentials.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error:
        "Credenciais Pluggy não configuradas. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nas env vars do Vercel.",
    });
  }

  try {
    const authResp = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const auth = await authResp.json();
    if (!authResp.ok || !auth.apiKey) {
      return res.status(502).json({ error: "Falha ao autenticar na Pluggy.", detail: auth });
    }

    const ctResp = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": auth.apiKey },
      body: JSON.stringify({}),
    });
    const ct = await ctResp.json();
    if (!ctResp.ok || !ct.accessToken) {
      return res.status(502).json({ error: "Falha ao gerar connect token.", detail: ct });
    }

    return res.status(200).json({ connectToken: ct.accessToken });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Erro ao contatar a Pluggy." });
  }
}
