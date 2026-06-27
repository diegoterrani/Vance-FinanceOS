-- Planned accounts payable/receivable ("registros previstos").
create table public.registries (
  id              uuid primary key default gen_random_uuid(),
  company_cnpj    text not null references public.companies(cnpj) on delete cascade,
  description     text not null,
  direction       public.transaction_direction not null,
  value           numeric(14,2) not null,
  due_date        date,
  bank            text,
  category        text,
  recurrence      text not null default 'single',
  status          text not null default 'pending',
  document_number text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index registries_company_idx on public.registries(company_cnpj);
alter table public.registries enable row level security;
create policy "registries_member_all" on public.registries
  for all to authenticated
  using (private.is_member_of(company_cnpj) or private.is_admin())
  with check (private.is_member_of(company_cnpj) or private.is_admin());
