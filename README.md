# Vance FinanceOS

Frontend em React + Vite para a operação financeira da Vance, preparado para deploy no **Vercel** com bootstrap opcional de dados via **Supabase**.

## Rodando localmente

Pré-requisito: Node.js 20+

```bash
npm install
npm run dev
```

## Arquitetura de deploy

- **Vercel** hospeda o frontend Vite.
- **`/api/bootstrap`** roda como Serverless Function na Vercel.
- **Supabase** armazena um snapshot inicial da aplicação na tabela `app_bootstrap_snapshots`.
- Depois do primeiro carregamento, o estado do app continua sendo salvo no `localStorage` do navegador como fallback seguro.

## Variáveis de ambiente

Use o arquivo `.env.example` como referência.

### Frontend

- `VITE_BOOTSTRAP_API_PATH`: endpoint usado pelo browser para buscar o snapshot inicial.

### Serverless Function na Vercel

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave service role do Supabase.
- `SUPABASE_BOOTSTRAP_KEY`: chave lógica do snapshot a ser lido, por padrão `production`.

> `SUPABASE_SERVICE_ROLE_KEY` deve ser configurada apenas nas variáveis seguras da Vercel. Não exponha essa chave no frontend.

## Setup do Supabase

1. Crie um projeto no Supabase.
2. Execute a migration em `supabase/migrations/20260621230000_create_app_bootstrap_snapshots.sql`.
3. Insira ao menos uma linha na tabela `public.app_bootstrap_snapshots` com:
   - `key = 'production'` ou o valor definido em `SUPABASE_BOOTSTRAP_KEY`
   - `payload = <snapshot JSON válido da aplicação>`

Exemplo de consulta:

```sql
insert into public.app_bootstrap_snapshots (key, payload)
values (
  'production',
  '{"appState":{"theme":"dark","sidebarOpen":true,"density":"standard","selectedCompany":{"cnpj":"12345678000199","razaoSocial":"Vance Soluções de Crescimento LTDA","nomeFantasia":"VANCE","regime":"Simples Nacional","minBalanceAlert":10000,"timezone":"America/Sao_Paulo","certificateUploaded":true,"certificateExpiry":"21/06/2027"}},"transactions":[],"alerts":[],"users":[],"pluggyAccounts":[],"webhookLogs":[],"auditLogs":[]}'::jsonb
)
on conflict (key) do update
set payload = excluded.payload;
```

Se você quiser subir o dataset inicial completo, use a estrutura exportada em `src/lib/appSnapshot.ts`.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Mantenha o preset detectado como **Vite**.
3. Configure as variáveis:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BOOTSTRAP_KEY`
   - `VITE_BOOTSTRAP_API_PATH=/api/bootstrap`
4. Execute o deploy.

O arquivo `vercel.json` já fixa:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `installCommand`: `npm install`

## Validação

```bash
npm run lint
npm run build
```
