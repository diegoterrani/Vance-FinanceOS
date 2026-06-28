-- F1 multi-tenant: plans + tenants + tenant_id columns (applied via MCP).
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null,
  price_cents int not null, currency text not null default 'BRL',
  limits jsonb not null default '{}'::jsonb, mp_plan_id text,
  active boolean not null default true, created_at timestamptz not null default now()
);
insert into public.plans (code,name,price_cents,limits) values
 ('starter','Starter',9900, '{"companies":1,"users":3,"transactions_month":500,"ai_imports_month":50}'::jsonb),
 ('pro','Pro',29900,        '{"companies":5,"users":15,"transactions_month":5000,"ai_imports_month":500}'::jsonb),
 ('enterprise','Enterprise',79900,'{"companies":-1,"users":-1,"transactions_month":-1,"ai_imports_month":-1}'::jsonb);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, cnpj text,
  status text not null default 'trialing',
  plan_id uuid references public.plans(id),
  trial_ends_at timestamptz, owner_id uuid,
  created_at timestamptz not null default now()
);
alter table public.profiles add column tenant_id uuid references public.tenants(id);
alter table public.profiles add column is_super_admin boolean not null default false;

alter table public.companies            add column tenant_id uuid references public.tenants(id);
alter table public.transactions         add column tenant_id uuid references public.tenants(id);
alter table public.alerts               add column tenant_id uuid references public.tenants(id);
alter table public.accounts             add column tenant_id uuid references public.tenants(id);
alter table public.integration_settings add column tenant_id uuid references public.tenants(id);
alter table public.team_invites         add column tenant_id uuid references public.tenants(id);
alter table public.audit_logs           add column tenant_id uuid references public.tenants(id);
alter table public.webhook_logs         add column tenant_id uuid references public.tenants(id);
alter table public.registries           add column tenant_id uuid references public.tenants(id);

create index companies_tenant_idx on public.companies(tenant_id);
create index transactions_tenant_idx on public.transactions(tenant_id);
create index alerts_tenant_idx on public.alerts(tenant_id);
create index accounts_tenant_idx on public.accounts(tenant_id);
create index integration_settings_tenant_idx on public.integration_settings(tenant_id);
create index team_invites_tenant_idx on public.team_invites(tenant_id);
create index audit_logs_tenant_idx on public.audit_logs(tenant_id);
create index webhook_logs_tenant_idx on public.webhook_logs(tenant_id);
create index registries_tenant_idx on public.registries(tenant_id);
create index profiles_tenant_idx on public.profiles(tenant_id);
