-- F4 remaining: support tickets, usage metering, audited impersonation.
-- Apply in the Supabase SQL editor (MCP offline). Depends on F1 helpers
-- (private.my_tenant / is_super_admin / is_tenant_admin / set_tenant_id).

-- ===== Tickets =====
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subject text not null,
  status text not null default 'open',        -- open|pending|resolved|closed
  priority text not null default 'normal',    -- low|normal|high
  created_by uuid references public.profiles(id),
  assignee uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_tenant_idx on public.tickets(tenant_id);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  internal boolean not null default false,    -- private note (super-admin only)
  created_at timestamptz not null default now()
);
create index ticket_messages_ticket_idx on public.ticket_messages(ticket_id);

-- ===== Usage metering =====
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null,                          -- transaction|ai_import|api_call
  qty int not null default 1,
  created_at timestamptz not null default now()
);
create index usage_events_tenant_idx on public.usage_events(tenant_id);
create index usage_events_created_idx on public.usage_events(created_at);

-- ===== Impersonation audit =====
create table public.impersonation_logs (
  id uuid primary key default gen_random_uuid(),
  super_admin_id uuid references public.profiles(id),
  tenant_id uuid references public.tenants(id) on delete cascade,
  reason text,
  started_at timestamptz not null default now()
);
create index impersonation_logs_tenant_idx on public.impersonation_logs(tenant_id);

-- ===== RLS =====
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.usage_events enable row level security;
alter table public.impersonation_logs enable row level security;

create policy tickets_tenant on public.tickets for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());

create policy ticket_messages_select on public.ticket_messages for select to authenticated
  using ((tenant_id = private.my_tenant() and internal = false) or private.is_super_admin());
create policy ticket_messages_insert on public.ticket_messages for insert to authenticated
  with check (tenant_id = private.my_tenant() or private.is_super_admin());

create policy usage_select on public.usage_events for select to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin());
create policy usage_insert on public.usage_events for insert to authenticated
  with check (tenant_id = private.my_tenant() or private.is_super_admin());

create policy impersonation_super on public.impersonation_logs for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- ===== Triggers =====
-- tickets get tenant_id from the creator's tenant automatically
create trigger set_tenant_id_tickets before insert on public.tickets
  for each row execute function private.set_tenant_id();
-- usage_events default to caller's tenant when not given
create trigger set_tenant_id_usage before insert on public.usage_events
  for each row execute function private.set_tenant_id();
-- (ticket_messages: tenant_id is set explicitly to the ticket's tenant by the app)

-- Auto-meter a usage event whenever a transaction is created
create or replace function private.meter_transaction() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.usage_events (tenant_id, kind, qty) values (new.tenant_id, 'transaction', 1);
  return new;
end $$;
create trigger meter_transaction_after after insert on public.transactions
  for each row execute function private.meter_transaction();
