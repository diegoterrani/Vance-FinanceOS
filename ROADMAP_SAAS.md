# Roadmap — Vance Expert como SaaS Multi-Tenant

> Plano de evolução. Nada é implantado até aprovação. Base atual: Vite+React (Supabase + Vercel),
> projeto Supabase `gltffiwkzdvsxruexklw`, produção `vance-finance-os-beta.vercel.app`.

## Decisões travadas
- **1 usuário = 1 tenant** (um time por cliente; usuário pertence a um único tenant).
- **Subdomínios**: `www.` (vendas), `app.` (produto/cliente), `admin.` (backoffice Iron).
- **Aquisição**: trial **sem cartão**, **14 dias** de trial, **5 dias** de carência antes de suspender.
- **Planos (tiers fixos, ajustáveis no backoffice)**:
  - Starter R$99/mês — 1 empresa, 3 usuários, 500 transações/mês, 50 importações IA/mês.
  - Pro R$299/mês — 5 empresas, 15 usuários, 5.000 transações/mês, 500 importações IA/mês.
  - Enterprise R$799/mês — ilimitado + SLA.
- **Impersonação** pelo super-admin (Iron) **com auditoria**: permitida.

---

## 1. Arquitetura multi-tenant

### Hierarquia
`tenant` (cliente assinante) → `companies` (matriz/filiais) → transações/contas/alertas/etc.
Usuários (`profiles`) pertencem a **um** tenant. Iron Security é um tenant com usuários `is_super_admin`.

### Estratégia de isolamento
Shared-schema + **RLS por `tenant_id`** (padrão Supabase), defesa em profundidade:
- `tenant_id` denormalizado em todas as tabelas de negócio (RLS simples e rápida).
- Funções helper `SECURITY DEFINER` no schema `private` (fora da API).
- Super-admin com bypass explícito e auditado.

### Schema novo / alterações (esboço)
```sql
-- Tenants
create table tenants (
  id uuid pk default gen_random_uuid(),
  name text not null,
  status text not null default 'trialing', -- trialing|active|past_due|suspended|canceled
  plan_id uuid references plans(id),
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- profiles: vincular ao tenant + papel + super-admin
alter table profiles add column tenant_id uuid references tenants(id);
alter table profiles add column is_super_admin boolean not null default false;
-- role já existe (owner/admin/member/viewer) — passa a ser escopado ao tenant

-- tenant_id em todas as tabelas de negócio
alter table companies            add column tenant_id uuid references tenants(id);
alter table transactions         add column tenant_id uuid references tenants(id);
alter table alerts               add column tenant_id uuid references tenants(id);
alter table accounts             add column tenant_id uuid references tenants(id);
alter table integration_settings add column tenant_id uuid references tenants(id);
alter table team_invites         add column tenant_id uuid references tenants(id);
alter table audit_logs           add column tenant_id uuid references tenants(id);
alter table webhook_logs         add column tenant_id uuid references tenants(id);
```

### RLS (reescrita)
```sql
create function private.my_tenant() returns uuid language sql stable security definer
  set search_path=public as $$ select tenant_id from profiles where id = auth.uid() $$;
create function private.is_super_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select coalesce((select is_super_admin from profiles where id=auth.uid()),false) $$;
create function private.is_tenant_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('owner','admin')) $$;

-- padrão por tabela:
create policy tenant_isolation on transactions for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
```
Remove a gambiarra de **auto-enroll em todas as empresas** e o **admin global**.

### Provisionamento (signup)
- **Novo cadastro (owner)** → trigger cria `tenant` (status `trialing`, `trial_ends_at = now()+14d`) + `subscription` trial + define `profiles.tenant_id` e `role='owner'`.
- **Convite** (`/convite/:token`) → usuário entra no tenant existente, sem criar tenant.

---

## 2. Roteamento & estrutura de páginas (domínio `vance.expert`)
Adicionar **react-router-dom** + detecção de subdomínio (a SPA escolhe o shell pelo `host`).

| Host | Papel | Observação |
|---|---|---|
| `vance.expert` + `www.vance.expert` | **Landing/Vendas** (público) | apex + www |
| `finance.vance.expert` | **App do cliente** (autenticado) | **já no ar** — mantém, sem quebra |
| `admin.vance.expert` | **Backoffice** (somente `is_super_admin`) | novo |
| `app.vance.expert` (opcional) | redirect 301 → `finance.vance.expert` | só se quiser padronizar a marca "app" |

- O contexto de tenant (tenant, plano, billing_status, role, limites) e o guard de assinatura vivem no shell do `finance.`.
- Os 3 hosts apontam para o **mesmo build** no Vercel; o código detecta `window.location.host` e renderiza Landing / App / Backoffice.

### DNS (no seu provedor) + Vercel
Adicionar os domínios no projeto Vercel `vance-finance-os` (Settings → Domains) e criar os registros:
| Registro | Tipo | Valor |
|---|---|---|
| `vance.expert` (apex) | `A` | `76.76.21.21` (IP do Vercel; o painel confirma o valor exato) |
| `www` | `CNAME` | `cname.vercel-dns.com.` |
| `admin` | `CNAME` | `cname.vercel-dns.com.` |
| `finance` | `CNAME` | (já configurado — manter) |

> O painel do Vercel mostra o alvo/registro exato ao adicionar cada domínio; usar o que ele indicar.
> **Supabase Auth → Site URL** passa a `https://finance.vance.expert` e Redirect URLs incluem `https://finance.vance.expert/**` (resolve o link de reset).

---

## 3. Landing page + aquisição automatizada
- Página de vendas em `www.` (estática/SPA) com planos e CTA "Começar trial".
- Fluxo: CTA → `/signup` → cria conta → **provisiona tenant + trial 14d** → entra no `app.`.
- E-mails: boas-vindas, fim de trial se aproximando (exige SMTP próprio).

---

## 4. Pagamentos — Mercado Pago
### Tabelas
```sql
create table plans (id uuid pk, code text unique, name text, price_cents int, currency text default 'BRL',
  limits jsonb, mp_plan_id text, active bool default true);
create table subscriptions (id uuid pk, tenant_id uuid, plan_id uuid, status text,
  mp_preapproval_id text, current_period_start timestamptz, current_period_end timestamptz,
  cancel_at timestamptz, created_at timestamptz default now());
create table invoices (id uuid pk, tenant_id uuid, subscription_id uuid, amount_cents int,
  status text, due_date date, paid_at timestamptz, mp_payment_id text);
create table payments (id uuid pk, tenant_id uuid, invoice_id uuid, amount_cents int, status text,
  mp_payment_id text, method text, created_at timestamptz default now());
```
### Endpoints serverless
- `POST /api/mp/create-subscription` → cria preapproval (assinatura) no MP, devolve `init_point` (checkout).
- `POST /api/mp/webhook` → recebe eventos MP (payment/preapproval), valida assinatura, atualiza `invoices/subscriptions/tenants.status`.
- (interno) verificação de status para reativar tenant ao confirmar pagamento.
### Dunning & suspensão (pg_cron diário no Supabase)
- Gera fatura no fim do trial / renovação.
- D-3 / D0 / D+3: avisos por e-mail.
- Inadimplente > 5 dias → `tenant.status='suspended'`.
- Pagamento confirmado (webhook) → `status='active'` (reativa).
### Guard no app
- `status` ∈ {suspended, past_due além da carência} → bloqueia `app.` com tela "assinatura pendente / regularizar" (botão para checkout). Backoffice continua acessível ao super-admin.

---

## 5. Backoffice (tenant Iron Security, super-admin)
Subdomínio `admin.`, somente `is_super_admin`. Módulos:
- **Clientes/Tenants**: lista, status, plano, datas, uso; ações (suspender/reativar/cancelar).
- **Financeiro**: MRR, churn, inadimplência, recebíveis (faturas/pagamentos agregados).
- **Planos**: CRUD de tiers/limites/preços.
- **Chamados**: fila de tickets, atribuição, respostas (internas e ao cliente).
- **Usuários**: visão global, reset/convite, **impersonação com auditoria**.
- **Consumo de recursos**: importações IA, transações, chamadas API por tenant/período.
- **Auditoria global**.
Iron Security também usa Fluxo de Caixa + Conciliação no próprio tenant (como qualquer cliente).

### Tabelas
```sql
create table tickets (id uuid pk, tenant_id uuid, subject text, status text default 'open',
  priority text default 'normal', created_by uuid, assignee uuid, created_at timestamptz default now());
create table ticket_messages (id uuid pk, ticket_id uuid, author_id uuid, body text,
  internal bool default false, created_at timestamptz default now());
create table usage_events (id uuid pk, tenant_id uuid, kind text, qty int default 1, created_at timestamptz default now());
create table impersonation_logs (id uuid pk, super_admin_id uuid, tenant_id uuid,
  reason text, started_at timestamptz default now(), ended_at timestamptz);
```
RLS: tickets/usage visíveis ao próprio tenant + super-admin; impersonation_logs só super-admin.

---

## 6. Ajustes na estrutura JÁ deployada (resumo)
1. Migração de schema: `tenants`, `profiles.tenant_id`/`is_super_admin`, `tenant_id` em todas as tabelas + backfill.
2. **Reescrita completa das policies RLS** (company/admin-global → tenant-scoped + super-admin).
3. Trocar trigger de signup (sem auto-enroll; cria tenant para novos owners; convites entram no tenant).
4. Criar tenant **Iron Security**, marcar o usuário atual como `is_super_admin` + owner; mover as empresas existentes para o tenant correto (ou limpar).
5. Refactor `App.tsx` → react-router + `TenantContext` (tenant, plano, billing_status, limites) + guard de assinatura.
6. `permissions.ts`: papéis por tenant + super-admin.
7. Novos endpoints (MP checkout/webhook, provisionamento, impersonação) + cron de dunning/suspensão.
8. Env vars: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, SMTP_*, `APP_URL`/subdomínios.
9. Painel: domínios (3 subdomínios no Vercel), SMTP próprio, Site URL, MFA/leaked-password.

---

## 7. Fases de entrega
| Fase | Escopo | Critério de pronto |
|---|---|---|
| **F1 — Fundação multi-tenant** | tenants+RLS+trigger+migração+router+TenantContext | Dois tenants isolados (Iron + 1 teste) sem vazamento; super-admin enxerga ambos; app roteado por subdomínio |
| **F2 — Landing + aquisição** | site de vendas, signup self-service, trial 14d automático | Visitante cria conta → tenant provisionado → entra no app em trial |
| **F3 — Mercado Pago** | planos, checkout, webhook, faturas, dunning, suspensão | Assinatura cobra, webhook atualiza status, inadimplência suspende e pagamento reativa (sandbox) |
| **F4 — Backoffice** | tenants, financeiro, planos, consumo, impersonação | Iron gerencia clientes/planos/uso; impersonação auditada |
| **F5 — Chamados + metering** | tickets cliente↔Iron, limites por plano aplicados | Cliente abre ticket; limites bloqueiam excedente conforme plano |

F1 é pré-requisito de tudo.

---

## 8. Preciso de você (inputs externos)
- **Domínio**: ✅ `vance.expert` (DNS sob seu controle; app já em `finance.vance.expert`). DNS de `www`/`admin`/apex conforme a tabela da seção 2 — eu te passo os registros exatos quando formos plugar.
- **Mercado Pago**: conta + Access Token (sandbox e produção) + segredo de webhook. (Crio os planos via API/painel.)
- **SMTP** (Resend/SendGrid/SES) para e-mails de trial/cobrança.
- **Painel Supabase**: habilitar SMTP custom, Site/Redirect URLs, MFA/leaked-password.
- **Super-admin (Iron Security): `vance@iron-security.com`** ✅ (será criado/semeado na F1 com `is_super_admin=true`). `diego.terrani@gmail.com` passa a ser owner de um tenant cliente de teste. Confirmar nome legal/CNPJ da Iron Security.
