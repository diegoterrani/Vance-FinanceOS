-- F1: tenant-scoped RLS rewrite + auto tenant_id triggers (applied via MCP).
update public.registries x set tenant_id=c.tenant_id from public.companies c
  where x.company_cnpj=c.cnpj and x.tenant_id is null;

-- drop legacy company/admin-global policies
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "members_select_own_or_admin" on public.company_members;
drop policy if exists "members_admin_write" on public.company_members;
drop policy if exists "companies_select_member" on public.companies;
drop policy if exists "companies_admin_write" on public.companies;
drop policy if exists "transactions_member_all" on public.transactions;
drop policy if exists "alerts_member_all" on public.alerts;
drop policy if exists "accounts_member_all" on public.accounts;
drop policy if exists "audit_select_admin" on public.audit_logs;
drop policy if exists "audit_insert_authenticated" on public.audit_logs;
drop policy if exists "webhook_admin_all" on public.webhook_logs;
drop policy if exists "integration_admin_all" on public.integration_settings;
drop policy if exists "invites_select_member" on public.team_invites;
drop policy if exists "invites_admin_write" on public.team_invites;
drop policy if exists "registries_member_all" on public.registries;

drop function if exists private.is_admin();
drop function if exists private.is_member_of(text);
drop table if exists public.company_members;

create or replace function private.my_tenant() returns uuid language sql stable security definer
  set search_path=public as $$ select tenant_id from public.profiles where id=auth.uid() $$;
create or replace function private.is_super_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select coalesce((select is_super_admin from public.profiles where id=auth.uid()), false) $$;
create or replace function private.is_tenant_admin() returns boolean language sql stable security definer
  set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
revoke all on function private.my_tenant() from public, anon;
revoke all on function private.is_super_admin() from public, anon;
revoke all on function private.is_tenant_admin() from public, anon;
grant execute on function private.my_tenant() to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.is_tenant_admin() to authenticated;

create or replace function private.set_tenant_id() returns trigger language plpgsql security definer
  set search_path=public as $$
begin if new.tenant_id is null then new.tenant_id := private.my_tenant(); end if; return new; end $$;
create trigger set_tenant_id_transactions before insert on public.transactions for each row execute function private.set_tenant_id();
create trigger set_tenant_id_alerts before insert on public.alerts for each row execute function private.set_tenant_id();
create trigger set_tenant_id_accounts before insert on public.accounts for each row execute function private.set_tenant_id();
create trigger set_tenant_id_companies before insert on public.companies for each row execute function private.set_tenant_id();
create trigger set_tenant_id_integration before insert on public.integration_settings for each row execute function private.set_tenant_id();
create trigger set_tenant_id_invites before insert on public.team_invites for each row execute function private.set_tenant_id();
create trigger set_tenant_id_audit before insert on public.audit_logs for each row execute function private.set_tenant_id();
create trigger set_tenant_id_webhook before insert on public.webhook_logs for each row execute function private.set_tenant_id();
create trigger set_tenant_id_registries before insert on public.registries for each row execute function private.set_tenant_id();

alter table public.tenants enable row level security;
alter table public.plans enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or tenant_id = private.my_tenant() or private.is_super_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or (tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy tenants_select on public.tenants for select to authenticated
  using (id = private.my_tenant() or private.is_super_admin());
create policy tenants_admin on public.tenants for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());
create policy plans_read on public.plans for select to anon, authenticated using (true);
create policy plans_admin on public.plans for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());
create policy companies_select on public.companies for select to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin());
create policy companies_modify on public.companies for all to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin())
  with check ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy transactions_tenant on public.transactions for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
create policy alerts_tenant on public.alerts for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
create policy accounts_tenant on public.accounts for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
create policy registries_tenant on public.registries for all to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin())
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
create policy integration_tenant_admin on public.integration_settings for all to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin())
  with check ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy webhook_tenant_admin on public.webhook_logs for all to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin())
  with check ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy invites_select on public.team_invites for select to authenticated
  using (tenant_id = private.my_tenant() or private.is_super_admin());
create policy invites_modify on public.team_invites for all to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin())
  with check ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy audit_select on public.audit_logs for select to authenticated
  using ((tenant_id = private.my_tenant() and private.is_tenant_admin()) or private.is_super_admin());
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (tenant_id = private.my_tenant() or private.is_super_admin());
