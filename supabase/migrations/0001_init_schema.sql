-- VANCE FinanceOS — initial schema (Track B)
-- Modeled from src/types.ts. RLS enabled on every table.
-- Multi-tenant by company (CNPJ) via company_members.

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role            as enum ('viewer','analista','tesouraria','gerencia','diretor','admin');
create type public.user_status          as enum ('active','inactive','pending');
create type public.transaction_status   as enum ('pending','matched','manual','closed','disputed');
create type public.transaction_direction as enum ('inflow','outflow');
create type public.alert_level          as enum ('critical','high','medium','info');
create type public.alert_status         as enum ('active','snoozed','resolved');
create type public.account_type         as enum ('checking','savings','credit_card','investment','cash');
create type public.sync_status          as enum ('success','failed','syncing');

-- ============================================================
-- profiles  (1:1 with auth.users)
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null default '',
  email        text not null,
  avatar       text,
  role         public.user_role   not null default 'analista',
  status       public.user_status not null default 'active',
  last_active  timestamptz,
  last_ip      text,
  device       text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- companies
-- ============================================================
create table public.companies (
  cnpj                 text primary key,
  razao_social         text not null,
  nome_fantasia        text,
  regime               text,
  min_balance_alert    numeric(14,2) not null default 0,
  timezone             text default 'America/Sao_Paulo',
  certificate_uploaded boolean not null default false,
  certificate_expiry   date,
  logo                 text,
  created_at           timestamptz not null default now()
);

-- ============================================================
-- company_members  (which users belong to which company)
-- ============================================================
create table public.company_members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  company_cnpj text not null references public.companies(cnpj) on delete cascade,
  role         public.user_role not null default 'analista',
  created_at   timestamptz not null default now(),
  unique (user_id, company_cnpj)
);
create index company_members_user_idx    on public.company_members(user_id);
create index company_members_company_idx on public.company_members(company_cnpj);

-- ============================================================
-- transactions
-- ============================================================
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  company_cnpj    text not null references public.companies(cnpj) on delete cascade,
  description     text not null,
  bank            text,
  bank_code       text,
  direction       public.transaction_direction not null,
  status          public.transaction_status not null default 'pending',
  value           numeric(14,2) not null,
  date            date not null,
  reference       text,
  category        text,
  score           numeric,
  external_id     text,
  matched_id      uuid,
  document_number text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index transactions_company_idx on public.transactions(company_cnpj);
create index transactions_date_idx    on public.transactions(date);

-- ============================================================
-- alerts
-- ============================================================
create table public.alerts (
  id            uuid primary key default gen_random_uuid(),
  company_cnpj  text not null references public.companies(cnpj) on delete cascade,
  title         text not null,
  description   text,
  level         public.alert_level  not null default 'info',
  status        public.alert_status not null default 'active',
  category      text,
  date          timestamptz not null default now(),
  action_url    text,
  snoozed_until timestamptz
);
create index alerts_company_idx on public.alerts(company_cnpj);

-- ============================================================
-- accounts  (Pluggy bank accounts)
-- ============================================================
create table public.accounts (
  id           uuid primary key default gen_random_uuid(),
  company_cnpj text not null references public.companies(cnpj) on delete cascade,
  name         text not null,
  type         public.account_type not null default 'checking',
  bank_name    text,
  balance      numeric(14,2) not null default 0,
  sync_status  public.sync_status not null default 'success',
  last_sync    timestamptz
);
create index accounts_company_idx on public.accounts(company_cnpj);

-- ============================================================
-- webhook_logs  (integration logs — admin scope)
-- ============================================================
create table public.webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  event       text,
  status      text,
  timestamp   timestamptz not null default now(),
  duration    integer,
  status_code integer
);

-- ============================================================
-- audit_logs
-- ============================================================
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id),
  user_name  text,
  action     text not null,
  details    text,
  timestamp  timestamptz not null default now(),
  ip         text
);
create index audit_logs_user_idx on public.audit_logs(user_id);

-- ============================================================
-- Helpers
-- ============================================================
-- Membership check (security definer to avoid RLS recursion).
create or replace function public.is_member_of(p_cnpj text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members m
    where m.company_cnpj = p_cnpj and m.user_id = auth.uid()
  );
$$;

-- Global admin check.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.companies       enable row level security;
alter table public.company_members enable row level security;
alter table public.transactions    enable row level security;
alter table public.alerts          enable row level security;
alter table public.accounts        enable row level security;
alter table public.webhook_logs    enable row level security;
alter table public.audit_logs      enable row level security;

-- ---- profiles ----
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin());

-- ---- company_members (no recursion: scope to own rows) ----
create policy "members_select_own_or_admin" on public.company_members
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "members_admin_write" on public.company_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- companies ----
create policy "companies_select_member" on public.companies
  for select to authenticated using (public.is_member_of(cnpj) or public.is_admin());
create policy "companies_admin_write" on public.companies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- transactions ----
create policy "transactions_member_all" on public.transactions
  for all to authenticated
  using (public.is_member_of(company_cnpj) or public.is_admin())
  with check (public.is_member_of(company_cnpj) or public.is_admin());

-- ---- alerts ----
create policy "alerts_member_all" on public.alerts
  for all to authenticated
  using (public.is_member_of(company_cnpj) or public.is_admin())
  with check (public.is_member_of(company_cnpj) or public.is_admin());

-- ---- accounts ----
create policy "accounts_member_all" on public.accounts
  for all to authenticated
  using (public.is_member_of(company_cnpj) or public.is_admin())
  with check (public.is_member_of(company_cnpj) or public.is_admin());

-- ---- audit_logs (read for admins; insert by any authenticated actor) ----
create policy "audit_select_admin" on public.audit_logs
  for select to authenticated using (public.is_admin());
create policy "audit_insert_authenticated" on public.audit_logs
  for insert to authenticated with check (auth.uid() = user_id or public.is_admin());

-- ---- webhook_logs (admin only) ----
create policy "webhook_admin_all" on public.webhook_logs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
