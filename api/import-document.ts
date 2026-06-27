import { extractDocument } from "./_llm.js";

// Vercel Serverless Function. Replaces the Express route in server.ts for
// production. server.ts is kept only for local `npm run dev`.
//
// NOTE: Vercel serverless request bodies are capped at ~4.5MB. The original
// Express server allowed 15MB base64 payloads. Large documents may need a
// direct-to-storage upload flow (Supabase Storage) before extraction.
// Extraction is powered by OpenRouter (see api/_llm.ts).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { fileType, fileContent } = req.body || {};

    if (!fileContent) {
      return res.status(400).json({ error: "Conteúdo do arquivo não fornecido." });
    }

    const result = await extractDocument(fileContent, fileType);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro no processamento do documento pelo Gemini:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Erro ao processar o documento." });
  }
}
