-- Integration/config storage (bank APIs, ERP, webhooks, notifications) + team invites.

-- May contain secrets (client_secret, erp_token) -> admin-only RLS.
create table public.integration_settings (
  id           uuid primary key default gen_random_uuid(),
  company_cnpj text not null references public.companies(cnpj) on delete cascade,
  kind         text not null check (kind in ('bank_api','erp','webhook','notifications')),
  ref          text not null default '',
  config       jsonb not null default '{}'::jsonb,
  status       text,
  updated_by   uuid references public.profiles(id),
  updated_at   timestamptz not null default now(),
  unique (company_cnpj, kind, ref)
);
create index integration_settings_company_idx on public.integration_settings(company_cnpj);
alter table public.integration_settings enable row level security;
create policy "integration_admin_all" on public.integration_settings
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create table public.team_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  name         text,
  role         public.user_role not null default 'analista',
  company_cnpj text references public.companies(cnpj) on delete cascade,
  status       text not null default 'pending',
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  unique (email, company_cnpj)
);
create index team_invites_company_idx on public.team_invites(company_cnpj);
alter table public.team_invites enable row level security;
create policy "invites_select_member" on public.team_invites
  for select to authenticated using (private.is_member_of(company_cnpj) or private.is_admin());
create policy "invites_admin_write" on public.team_invites
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
