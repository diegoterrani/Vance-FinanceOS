import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedDocument {
  direction: "inflow" | "outflow";
  value: number;
  description: string;
  dueDate: string;
  documentNumber?: string;
  bank: string;
  category: string;
}

// Shared Gemini extraction logic used by both the local dev Express server
// (server.ts) and the Vercel serverless function (api/import-document.ts).
export async function extractDocument(
  fileContent: string,
  fileType?: string,
): Promise<ExtractedDocument> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada no servidor.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const documentPart = {
    inlineData: {
      mimeType: fileType || "application/pdf",
      data: fileContent,
    },
  };

  const systemInstruction = `Você é um assistente financeiro inteligente especializado em faturamento brasileiro. Analise o documento de boleto, nota fiscal (NF) ou XML fornecido e extraia com precisão absoluta as informações necessárias para preenchimento de um lançamento de contas a pagar/receber previsto.

Extraia as seguintes propriedades:
1. direction: se for uma cobrança, conta de fornecedor, boleto a pagar, ou despesa de qualquer tipo, retorne 'outflow' (A Pagar). Se for uma nota de venda, faturamento para cliente, ou contrato de entrada de recursos, retorne 'inflow' (A Receber). Na maioria das vezes, boletos bancários e notas fiscais de fornecedores são 'outflow'.
2. value: o valor total (principal) do boleto ou nota fiscal como um número positivo (ex: 2500.00). Nunca retorne negativo aqui.
3. description: descrição resumida e clara do lançamento (ex: "TELEFONICA BRASIL S.A.", "NF 4920 - FORNECEDOR ABC", "BOLETO COSERN"). Deve ser em MAIÚSCULAS e sem acentos se possível.
4. dueDate: data de vencimento no formato AAAA-MM-DD. Se não houver data de vencimento explícita, tente estimar ou use '2026-06-25'.
5. documentNumber: o número da nota fiscal ou do boleto ou do recibo (ex: "NF-1234", "BOL-4321").
6. bank: o banco emissor do boleto ou o banco sugerido para a transação. Escolha estritamente entre estes três valores: 'Itaú Unibanco S.A.', 'Banco do Brasil S.A.' ou 'XP Investimentos'. Se não houver indicação clara, selecione 'Itaú Unibanco S.A.'.
7. category: a categoria analítica correspondente mais apropriada para o lançamento.
   Se direction for 'inflow', escolha obrigatoriamente uma destas opções: 'Contratos Clientes', 'Juros e Rendimentos', 'Honorários Extra', 'Aportes Sócio'.
   Se direction for 'outflow', escolha obrigatoriamente uma destas opções: 'Sistemas e Softwares', 'Fornecedores e Logística', 'Folha de Pagamento', 'Impostos e Contribuições', 'Infraestrutura', 'Marketing e Vendas'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [documentPart, "Extraia os dados de faturamento do documento anexo."],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          direction: { type: Type.STRING, description: "Strictly 'inflow' or 'outflow'" },
          value: { type: Type.NUMBER, description: "The positive numeric total value" },
          description: { type: Type.STRING, description: "Short uppercase description of the transaction" },
          dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
          documentNumber: { type: Type.STRING, description: "Invoice or slip document number if available" },
          bank: { type: Type.STRING, description: "Suggested bank: 'Itaú Unibanco S.A.', 'Banco do Brasil S.A.', or 'XP Investimentos'" },
          category: { type: Type.STRING, description: "Category matching the selected transaction direction" },
        },
        required: ["direction", "value", "description", "dueDate", "bank", "category"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Não foi possível obter resposta do Gemini.");
  }

  return JSON.parse(text.trim()) as ExtractedDocument;
}
