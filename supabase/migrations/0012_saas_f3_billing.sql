-- F3: billing tables (written by serverless via service role; clients read-only).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text not null default 'pending',
  mp_preapproval_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_tenant_idx on public.subscriptions(tenant_id);
create index subscriptions_mp_idx on public.subscriptions(mp_preapproval_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount_cents int not null, status text not null default 'open',
  due_date date, paid_at timestamptz, mp_payment_id text,
  created_at timestamptz not null default now()
);
create index invoices_tenant_idx on public.invoices(tenant_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount_cents int, status text, mp_payment_id text, method text,
  created_at timestamptz not null default now()
);
create index payments_tenant_idx on public.payments(tenant_id);

alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
create policy subscriptions_read on public.subscriptions for select to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy invoices_read on public.invoices for select to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy payments_read on public.payments for select to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());

alter table public.tenants add column if not exists past_due_since timestamptz;
