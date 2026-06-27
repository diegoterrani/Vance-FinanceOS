// LLM layer — OpenRouter (OpenAI-compatible Chat Completions API).
// Replaces the previous @google/genai (Gemini) integration.
//
// Env:
//   OPENROUTER_API_KEY  (required, server-side only)
//   OPENROUTER_MODEL    (optional, overrides the primary model)
//   APP_URL             (optional, sent as HTTP-Referer for OpenRouter ranking)

export interface ExtractedDocument {
  direction: "inflow" | "outflow";
  value: number;
  description: string;
  dueDate: string;
  documentNumber?: string;
  bank: string;
  category: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Primary model + ordered fallbacks. OpenRouter tries them in order.
const MODELS = [
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openrouter/owl-alpha",
];

const SYSTEM_INSTRUCTION = `Você é um assistente financeiro inteligente especializado em faturamento brasileiro. Analise o documento de boleto, nota fiscal (NF) ou XML fornecido e extraia com precisão absoluta as informações necessárias para preenchimento de um lançamento de contas a pagar/receber previsto.

Extraia as seguintes propriedades:
1. direction: se for uma cobrança, conta de fornecedor, boleto a pagar, ou despesa de qualquer tipo, retorne 'outflow' (A Pagar). Se for uma nota de venda, faturamento para cliente, ou contrato de entrada de recursos, retorne 'inflow' (A Receber). Na maioria das vezes, boletos bancários e notas fiscais de fornecedores são 'outflow'.
2. value: o valor total (principal) do boleto ou nota fiscal como um número positivo (ex: 2500.00). Nunca retorne negativo aqui.
3. description: descrição resumida e clara do lançamento (ex: "TELEFONICA BRASIL S.A.", "NF 4920 - FORNECEDOR ABC", "BOLETO COSERN"). Deve ser em MAIÚSCULAS e sem acentos se possível.
4. dueDate: data de vencimento no formato AAAA-MM-DD. Se não houver data de vencimento explícita, tente estimar ou use '2026-06-25'.
5. documentNumber: o número da nota fiscal ou do boleto ou do recibo (ex: "NF-1234", "BOL-4321").
6. bank: o banco emissor do boleto ou o banco sugerido para a transação. Escolha estritamente um destes valores: 'Itaú Unibanco S.A.', 'Banco do Brasil S.A.', 'XP Investimentos', 'Banco C6 S.A.', 'Caixa Econômica Federal', 'Banco Genial S.A.', 'Bradesco S.A.', 'Santander S.A.' ou 'Nubank PJ'. Se não houver indicação clara, selecione 'Itaú Unibanco S.A.'.
7. category: a categoria analítica correspondente mais apropriada para o lançamento.
   Se direction for 'inflow', escolha obrigatoriamente uma destas opções: 'Contratos Clientes', 'Juros e Rendimentos', 'Honorários Extra', 'Aportes Sócio'.
   Se direction for 'outflow', escolha obrigatoriamente uma destas opções: 'Sistemas e Softwares', 'Fornecedores e Logística', 'Folha de Pagamento', 'Impostos e Contribuições', 'Infraestrutura', 'Marketing e Vendas'.

Responda EXCLUSIVAMENTE com um objeto JSON válido, sem texto antes ou depois, sem blocos de markdown, exatamente neste formato:
{"direction":"inflow|outflow","value":0,"description":"","dueDate":"AAAA-MM-DD","documentNumber":"","bank":"","category":""}`;

// Build the multimodal user content. Images go as image_url; everything else
// (PDF/XML/etc) goes as a file part parsed by OpenRouter's file plugin.
function buildContent(fileContent: string, fileType?: string) {
  const mime = fileType || "application/pdf";
  const dataUrl = `data:${mime};base64,${fileContent}`;
  const instruction = "Extraia os dados de faturamento do documento anexo.";

  if (mime.startsWith("image/")) {
    return [
      { type: "text", text: instruction },
      { type: "image_url", image_url: { url: dataUrl } },
    ];
  }

  return [
    { type: "text", text: instruction },
    { type: "file", file: { filename: `documento.${mime.split("/")[1] || "pdf"}`, file_data: dataUrl } },
  ];
}

function parseJson(raw: string): ExtractedDocument {
  let text = raw.trim();
  // Strip ```json ... ``` fences if a model wraps the output.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text) as ExtractedDocument;
}

export async function extractDocument(
  fileContent: string,
  fileType?: string,
): Promise<ExtractedDocument> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Chave OPENROUTER_API_KEY não configurada no servidor.");
  }

  const isPdf = !(fileType || "application/pdf").startsWith("image/");

  const body: Record<string, unknown> = {
    model: MODELS[0],
    models: MODELS,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: buildContent(fileContent, fileType) },
    ],
  };
  // Ask OpenRouter to parse PDFs server-side (text engine).
  if (isPdf) {
    body.plugins = [{ id: "file-parser", pdf: { engine: "pdf-text" } }];
  }

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "https://vance-finance-os.vercel.app",
      "X-Title": "VANCE FinanceOS",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`OpenRouter respondeu ${resp.status}: ${detail.slice(0, 500)}`);
  }

  const data: any = await resp.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Não foi possível obter resposta do modelo (OpenRouter).");
  }

  return parseJson(text);
}
