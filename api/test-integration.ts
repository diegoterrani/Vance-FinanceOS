// Real connectivity test for an ERP / generic REST integration. Performs an
// actual outbound HTTP request to the endpoint configured by the user, using
// the credentials they provide. Returns status + latency.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Método não permitido." });
  }

  const { url, token, appKey } = req.body || {};
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ ok: false, message: "URL inválida ou não informada." });
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (appKey) headers["X-App-Key"] = appKey;

    const resp = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    return res.status(200).json({
      ok: resp.ok,
      status: resp.status,
      latencyMs,
      message: resp.ok
        ? "Conexão estabelecida com o endpoint."
        : `Endpoint respondeu HTTP ${resp.status}.`,
    });
  } catch (e: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const aborted = e?.name === "AbortError";
    return res.status(200).json({
      ok: false,
      status: 0,
      latencyMs,
      message: aborted ? "Tempo limite (8s) excedido." : `Falha de conexão: ${e?.message || e}`,
    });
  }
}
