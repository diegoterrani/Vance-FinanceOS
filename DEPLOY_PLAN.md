# Plano de Deploy — VANCE FinanceOS (Vercel + Supabase)

> Gerado em 2026-06-26. Fonte: repo `diegoterrani/Vance-FinanceOS`, projeto Vercel `iron-security/vance-finance-os`, projeto Supabase `gltffiwkzdvsxruexklw`.

## 1. Diagnóstico (estado real hoje)

| Item | Situação | Impacto no deploy |
|---|---|---|
| **Stack** | Vite + React 19 (SPA) + Express (`server.ts`) com 1 rota `/api/import-document` que chama o Gemini | Não é Angular |
| **Vercel** | Projeto existe (`prj_2iGVEJpUJAboIQ9UxPewkicr6wIx`, team `team_ekt4lqxDYpjWzuYCpL5VkFN3`), framework **detectado errado como `angular`**, Node 24.x, `live: false` | Precisa reconfigurar build/framework |
| **Servidor** | `server.ts` usa `app.listen(3000)` (modelo container/Cloud Run) | **Não roda em serverless do Vercel como está** — precisa virar Vercel Function |
| **Auth** | Falsa: `localStorage['vance_session_user']`, lista de usuários mock, senha ignorada | Não há autenticação real |
| **Dados** | 100% mock em memória (`initialTransactions`, `initialUsers`, `initialAlerts`, `initialPluggyAccounts`, etc. em `src/App.tsx`) — nada persiste | Sem backend de dados |
| **Supabase** | Projeto `ACTIVE_HEALTHY`, região `sa-east-1`, Postgres 17, **banco vazio (0 tabelas)** | Provisionado mas **não usado em lugar nenhum do código** |
| **Segredos** | `GEMINI_API_KEY` (server-side), `APP_URL` | Configurar no Vercel |

**Conclusão honesta:** "deploy com Vercel + Supabase" não é só configuração. Pôr a app no ar (Track A) é rápido. Fazer ela *usar* o Supabase (Track B: auth real + persistência) é desenvolvimento novo. O plano separa os dois para você poder ter URL no ar hoje e migrar o backend depois.

---

## 2. Decisões de arquitetura (resolver antes de começar)

1. **Como rodar a rota Gemini no Vercel.** O Express com `app.listen` não funciona em serverless. Duas opções:
   - **(Recomendado) Converter para Vercel Function:** mover a lógica de `/api/import-document` para `api/import-document.ts` (handler serverless). Frontend vira estático (`vite build` → `dist`). `server.ts` fica só para dev local.
   - Alternativa: empacotar o Express com `@vercel/node` exportando o `app` como handler. Mais atrito; não recomendado.
2. **Papel do Supabase.** Banco de dados + Auth + RLS. Substitui os arrays mock e o login falso.
3. **Chave do Gemini é server-side.** Nunca expor no cliente. Fica só na Vercel Function (`GEMINI_API_KEY`, sem prefixo `VITE_`).

---

## 3. Track A — Deploy no Vercel (app atual, sem Supabase ainda)

Objetivo: URL de produção funcionando, com o import de documentos via Gemini.

### A1. Converter a rota Gemini para Vercel Function
Criar `api/import-document.ts` com o conteúdo do handler de `server.ts` (o `systemInstruction`, o `responseSchema` e a chamada `ai.models.generateContent` permanecem iguais), exportando `export default function handler(req, res)`. Manter `server.ts` apenas para `npm run dev`.

### A2. `vercel.json` (frontend estático + função)
```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
> `rewrites` faz o SPA funcionar em refresh de rota. As funções em `api/` são roteadas automaticamente e não são afetadas pelo rewrite.

### A3. Corrigir o framework no Vercel
No painel do projeto → Settings → Build & Development:
- Framework Preset: **Other / Vite** (hoje está como Angular — errado).
- Build Command: `vite build`
- Output Directory: `dist`
- Install Command: `npm install`

### A4. Variável de ambiente (Production + Preview)
- `GEMINI_API_KEY` = *(sua chave do Gemini)* — escopo: Production, Preview. **Não** marcar como exposta ao browser.

### A5. Deploy
- Conectar o repo GitHub ao projeto Vercel (deploy automático no push da `main`), ou `vercel --prod` via CLI.
- Validar: app carrega, login mock entra, upload de boleto/NF retorna JSON extraído pela função.

**Resultado do Track A:** app no ar, dados ainda voláteis (somem ao recarregar), auth ainda falsa.

---

## 4. Track B — Integração Supabase (auth real + persistência)

### B1. Conexão (env do frontend)
Variáveis no Vercel (prefixo `VITE_` porque são lidas no browser):
- `VITE_SUPABASE_URL` = `https://gltffiwkzdvsxruexklw.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_02MJNI_S1n04FcZqOX9UJQ_-ZmwO5Rm`  *(chave publishable, segura para cliente)*

Adicionar dependência: `npm i @supabase/supabase-js` e criar `src/lib/supabase.ts` com `createClient(...)`.

### B2. Schema (migração inicial)
Modelar a partir de `src/types.ts`. Tabelas no schema `public`, todas com RLS ligada:

| Tabela | Origem (mock) | Notas |
|---|---|---|
| `profiles` | `User` | PK = `auth.users.id`; campos `name, role, status, avatar`; criada por trigger no signup |
| `companies` | `Company` | PK `cnpj`; `razao_social, regime, min_balance_alert, timezone`, etc. |
| `transactions` | `Transaction` | FK `company_cnpj`; `direction, status, value, date, category, bank, document_number` |
| `alerts` | `Alert` | FK `company_cnpj`; `level, status, snoozed_until` |
| `accounts` | `PluggyAccount` | FK `company_cnpj`; integração Pluggy |
| `webhook_logs` | `WebhookLog` | logs de integração |
| `audit_logs` | `AuditLog` | trilha de auditoria; `user_id` → `profiles` |

> Aplicar via `supabase/migrations/*.sql` (CLI) ou `apply_migration` no MCP. Versionar as migrações no repo.

### B3. RLS (obrigatório — dados financeiros)
- Ligar RLS em **todas** as tabelas.
- Política base: usuário só lê/escreve linhas das empresas a que pertence (tabela de associação `company_members(user_id, company_cnpj, role)`).
- `audit_logs`: insert pelo backend, sem update/delete pelo cliente.
- Rodar o **Security Advisor** do Supabase após criar o schema e zerar os alertas antes de ir a produção.

### B4. Auth real
- Trocar o login mock por `supabase.auth.signInWithPassword` / `signUp` em `src/pages/Login.tsx`.
- Substituir `localStorage['vance_session_user']` por sessão do Supabase (`supabase.auth.getSession` / `onAuthStateChange`) em `src/App.tsx`.
- Mapear `UserRole` (`viewer/analista/tesouraria/gerencia/diretor/admin`) para `profiles.role` e aplicar em `src/lib/permissions.ts`.

### B5. Substituir os arrays mock por queries
- Trocar cada `useState(initialX)` em `src/App.tsx` por carga via Supabase (`select`) + mutations (`insert/update/delete`).
- A função `api/import-document` continua extraindo o lançamento; após extrair, gravar em `transactions` (no cliente autenticado ou na própria função usando o token do usuário).

---

## 5. Variáveis de ambiente (resumo)

| Variável | Onde | Escopo | Valor |
|---|---|---|---|
| `GEMINI_API_KEY` | Vercel (server) | Production, Preview | *(secreta — sua chave)* |
| `VITE_SUPABASE_URL` | Vercel (client) | Production, Preview | `https://gltffiwkzdvsxruexklw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Vercel (client) | Production, Preview | `sb_publishable_02MJNI_S1n04FcZqOX9UJQ_-ZmwO5Rm` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server) — só se a função precisar bypass de RLS | Production | *(secreta — nunca no cliente)* |

`.env.local` para dev espelha as mesmas (não commitar; `.gitignore` já cobre `.env*`).

---

## 6. Ordem de execução recomendada

1. **Track A completo** → URL de produção no ar com Gemini funcionando. (~meio dia)
2. **B1–B3** → conexão Supabase + schema + RLS (sem mexer na UI ainda). Validar com Security Advisor.
3. **B4** → auth real (maior risco de regressão; testar fluxo login/signup/logout).
4. **B5** → migrar leitura/escrita de dados, tabela por tabela (começar por `transactions`).
5. Apontar domínio final e marcar produção como `live`.

---

## 7. Riscos e pontos de atenção

- **`server.ts` não vai pra produção no Vercel** — é só dev. Se esquecer e configurar `npm start`, o deploy falha.
- **Segurança de dados financeiros:** sem RLS bem feita, qualquer usuário lê tudo. RLS é bloqueante, não opcional.
- **Chave do Gemini:** se vazar para o bundle do cliente (prefixo errado), qualquer um usa sua cota. Manter só na função.
- **Migração de auth:** a app hoje "cria usuário transiente" no login. Esse comportamento some com Supabase Auth — alinhar expectativa.
- **Região:** Supabase em `sa-east-1` (São Paulo) é bom para latência no Brasil; escolher região Vercel próxima (ou usar funções na região `gru1`).
```

---

## STATUS: DONE
Plano salvo em `DEPLOY_PLAN.md`. É um plano, não execução — nenhuma mudança foi feita no Vercel, Supabase ou repo.
