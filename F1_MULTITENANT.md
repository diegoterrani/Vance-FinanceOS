# F1 — Fundação Multi-Tenant (detalhamento executável)

> Pré-requisito de todo o SaaS. **Destrutivo na base no ar** (reescreve RLS + signup + migra dados).
> Nada é aplicado sem seu OK. Projeto Supabase `gltffiwkzdvsxruexklw`. Super-admin: `vance@iron-security.com`.

## Estado atual relevante
- Tabelas: profiles(1: diego), companies(2 demo), company_members(2), transactions/alerts/accounts/webhook_logs/audit_logs (vazias após limpeza), integration_settings, team_invites.
- RLS hoje: `private.is_admin()` (role='admin' global) + `private.is_member_of(cnpj)`.
- Trigger `handle_new_user`: cria profile + **auto-enrola em todas as empresas** (remover).

## Ordem de execução (migrações)

### M1 — Planos
```sql
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null,
  price_cents int not null, currency text default 'BRL',
  limits jsonb not null default '{}'::jsonb, mp_plan_id text, active bool default true,
  created_at timestamptz default now()
);
insert into public.plans (code,name,price_cents,limits) values
 ('starter','Starter',9900, '{"companies":1,"users":3,"transactions_month":500,"ai_imports_month":50}'),
 ('pro','Pro',29900,        '{"companies":5,"users":15,"transactions_month":5000,"ai_imports_month":500}'),
 ('enterprise','Enterprise',79900,'{"companies":-1,"users":-1,"transactions_month":-1,"ai_imports_month":-1}');
-- (-1 = ilimitado)
```

### M2 — Tenants + colunas em profiles
```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, cnpj text,
  status text not null default 'trialing',           -- trialing|active|past_due|suspended|canceled
  plan_id uuid references public.plans(id),
  trial_ends_at timestamptz, owner_id uuid,
  created_at timestamptz default now()
);
alter table public.profiles add column tenant_id uuid references public.tenants(id);
alter table public.profiles add column is_super_admin boolean not null default false;
```

### M3 — `tenant_id` nas tabelas de negócio
```sql
alter table public.companies            add column tenant_id uuid references public.tenants(id);
alter table public.transactions         add column tenant_id uuid references public.tenants(id);
alter table public.alerts               add column tenant_id uuid references public.tenants(id);
alter table public.accounts             add column tenant_id uuid references public.tenants(id);
alter table public.integration_settings add column tenant_id uuid references public.tenants(id);
alter table public.team_invites         add column tenant_id uuid references public.tenants(id);
alter table public.audit_logs           add column tenant_id uuid references public.tenants(id);
alter table public.webhook_logs         add column tenant_id uuid references public.tenants(id);
-- índices
create index on public.companies(tenant_id); create index on public.transactions(tenant_id);
create index on public.alerts(tenant_id); create index on public.accounts(tenant_id);
create index on public.integration_settings(tenant_id);
```

### M4 — Migração de dados (backfill)
```sql
-- Tenant cliente de teste (dono: diego), recebe as empresas demo existentes
with t as (
  insert into public.tenants (name, status, plan_id, trial_ends_at)
  values ('Vance Demo (Cliente)', 'trialing',
          (select id from public.plans where code='pro'), now() + interval '14 days')
  returning id
)
update public.companies set tenant_id = (select id from t);
-- profile do diego -> tenant demo, role owner
update public.profiles p set tenant_id = c.tenant_id, role='owner'
  from public.companies c
  where p.email='diego.terrani@gmail.com' and c.tenant_id is not null;
update public.tenants set owner_id = (select id from public.profiles where email='diego.terrani@gmail.com')
  where name='Vance Demo (Cliente)';
-- backfill tenant_id nas demais tabelas via company
update public.transactions x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj;
update public.alerts x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj;
update public.accounts x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj;
update public.integration_settings x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj;
update public.team_invites x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj;
```

### M5 — Tenant Iron Security + super-admin
```sql
-- 1) cria tenant Iron Security (enterprise, ativo)
insert into public.tenants (name, status, plan_id) values
 ('Iron Security','active',(select id from public.plans where code='enterprise'));
-- 2) cria usuário auth vance@iron-security.com (confirmado; tokens '' p/ GoTrue)
insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
  confirmation_token,recovery_token,email_change,email_change_token_new)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(),'authenticated','authenticated',
  'vance@iron-security.com', extensions.crypt('<SENHA_TEMP>', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}','{"name":"Vance Admin","role":"owner"}', now(), now(),
  '','','',''
where not exists (select 1 from auth.users where email='vance@iron-security.com');
-- 3) profile do super-admin -> tenant Iron + flag
update public.profiles set tenant_id=(select id from public.tenants where name='Iron Security'),
  role='owner', is_super_admin=true where email='vance@iron-security.com';
```

### M6 — Helpers + RLS (reescrita)
```sql
create or replace function private.my_tenant() returns uuid language sql stable security definer
  set search_path=public as $$ select tenant_id from public.profiles where id=auth.uid() $$;
create or replace function private.is_super_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select coalesce((select is_super_admin from public.profiles where id=auth.uid()),false) $$;
create or replace function private.is_tenant_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('owner','admin')) $$;
revoke all on function private.my_tenant(), private.is_super_admin(), private.is_tenant_admin() from public, anon;
grant execute on function private.my_tenant(), private.is_super_admin(), private.is_tenant_admin() to authenticated;

-- Para cada tabela de negócio: DROP das policies antigas e CREATE da nova padrão:
-- (transactions, alerts, accounts, companies, integration_settings, team_invites, audit_logs, webhook_logs)
--   for all to authenticated
--   using (tenant_id = private.my_tenant() or private.is_super_admin())
--   with check (tenant_id = private.my_tenant() or private.is_super_admin())
-- profiles:
--   select/update: id=auth.uid() OR tenant_id=private.my_tenant() (ver equipe) OR is_super_admin()
-- tenants/plans/subscriptions: select próprio tenant + super-admin; escrita super-admin (planos) / tenant_admin (dados do tenant)
```

### M7 — Trigger de signup (sem auto-enroll)
```sql
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare v_tenant uuid; v_invite text := new.raw_user_meta_data->>'invite_token';
begin
  if v_invite is not null then
    -- convite: entra no tenant do convite, papel definido no convite
    select company_cnpj into v_tenant from public.team_invites where id::text=v_invite; -- (ajustar p/ tenant_id no convite)
    insert into public.profiles (id,email,name,tenant_id,role)
      values (new.id,new.email,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),
              v_tenant, coalesce((new.raw_user_meta_data->>'role')::user_role,'member'));
  else
    -- novo cliente: cria tenant trial + owner
    insert into public.tenants (name,status,plan_id,trial_ends_at)
      values (coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email,'@',1)||' (Conta)'),
              'trialing',(select id from public.plans where code='starter'), now()+interval '14 days')
      returning id into v_tenant;
    insert into public.profiles (id,email,name,tenant_id,role)
      values (new.id,new.email,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),v_tenant,'owner');
    update public.tenants set owner_id=new.id where id=v_tenant;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
```
> Remove o loop de auto-enroll em todas as empresas. (Convite por `tenant_id` será finalizado quando a tela de convites da F1 for ajustada.)

## Frontend (F1)
1. `npm i react-router-dom`.
2. **Host shell** (`src/main.tsx` ou um `Root.tsx`): lê `window.location.host` → renderiza `Marketing` (apex/www, placeholder na F1) | `App` (finance) | `Backoffice` (admin, só super-admin).
3. **`src/context/TenantContext.tsx`**: carrega tenant atual (`tenants` via profile), plano, `status`/`trial_ends_at`, role, `is_super_admin`, limites. Expõe `useTenant()`.
4. **`App.tsx`**: envolver com `<BrowserRouter>` + `TenantProvider`; manter as views atuais sob o shell do cliente.
5. **Guard de assinatura** (F1 = só estrutura; lógica plena na F3): se `status in (suspended)` → tela "assinatura suspensa".
6. **`permissions.ts`**: papéis por tenant + `is_super_admin`.
7. `db.ts`: incluir `tenant_id` nos inserts (ou deixar a policy/trigger preencher) e filtrar por tenant nas leituras (RLS já garante; manter explícito por clareza).

## Critérios de pronto (aceite F1)
- Login `diego@` vê **apenas** dados do tenant Demo; não enxerga nada da Iron.
- Login `vance@iron-security.com` (super-admin) acessa `admin.` e enxerga todos os tenants.
- Novo signup cria **tenant próprio** em trial de 14 dias, isolado.
- Advisor de segurança Supabase sem novos lints; nenhuma policy permitindo cross-tenant.
- App roteado por host; `finance.` segue funcionando.

## Rollback
- Migrações em ordem; manter `supabase/migrations/00xx_*.sql` versionadas.
- Antes de aplicar em produção: snapshot/branch do Supabase (ou dump) para reverter.
- Como a base de negócio está praticamente vazia, o risco de perda é baixo; ainda assim, validar em **Supabase branch** antes do projeto principal.

## Inputs para iniciar F1
- Senha temporária para `vance@iron-security.com` (ou eu gero e te entrego para troca no 1º acesso).
- CNPJ/nome legal Iron Security (pode entrar placeholder e ajustar).
- OK para aplicar (faço via Supabase branch primeiro, te mostro, depois promovo).
