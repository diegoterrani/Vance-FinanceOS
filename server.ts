import express from "express";
import path from "path";
import dotenv from "dotenv";
import { extractDocument } from "./api/_llm";

dotenv.config();

// Local development server. In production the app is served statically by
// Vercel and the API runs as a serverless function (api/import-document.ts).
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with increased payload limit for base64 files (up to 15MB)
  app.use(express.json({ limit: "15mb" }));

  // API endpoint for document import (mirrors api/import-document.ts)
  app.post("/api/import-document", async (req, res) => {
    try {
      const { fileType, fileContent } = req.body;

      if (!fileContent) {
        return res.status(400).json({ error: "Conteúdo do arquivo não fornecido." });
      }

      const result = await extractDocument(fileContent, fileType);
      res.json(result);
    } catch (error: any) {
      console.error("Erro no processamento do documento pelo Gemini:", error);
      res.status(500).json({ error: error?.message || "Erro ao processar o documento." });
    }
  });

  // Serve Vite in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
