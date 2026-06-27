-- Move RLS helper functions out of the API-exposed public schema into a
-- private schema (not reachable via /rest/v1/rpc) and lock down the signup
-- trigger function. Clears advisor lints 0028/0029.

create schema if not exists private;
revoke all on schema private from anon, authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "members_select_own_or_admin"  on public.company_members;
drop policy if exists "members_admin_write"          on public.company_members;
drop policy if exists "companies_select_member"       on public.companies;
drop policy if exists "companies_admin_write"         on public.companies;
drop policy if exists "transactions_member_all"       on public.transactions;
drop policy if exists "alerts_member_all"             on public.alerts;
drop policy if exists "accounts_member_all"           on public.accounts;
drop policy if exists "audit_select_admin"            on public.audit_logs;
drop policy if exists "audit_insert_authenticated"    on public.audit_logs;
drop policy if exists "webhook_admin_all"             on public.webhook_logs;

drop function if exists public.is_member_of(text);
drop function if exists public.is_admin();

create or replace function private.is_member_of(p_cnpj text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members m
    where m.company_cnpj = p_cnpj and m.user_id = auth.uid()
  );
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function private.is_member_of(text) from public, anon;
revoke all on function private.is_admin()         from public, anon;
grant execute on function private.is_member_of(text) to authenticated;
grant execute on function private.is_admin()         to authenticated;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (id = auth.uid() or private.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or private.is_admin());

create policy "members_select_own_or_admin" on public.company_members
  for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy "members_admin_write" on public.company_members
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "companies_select_member" on public.companies
  for select to authenticated using (private.is_member_of(cnpj) or private.is_admin());
create policy "companies_admin_write" on public.companies
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "transactions_member_all" on public.transactions
  for all to authenticated
  using (private.is_member_of(company_cnpj) or private.is_admin())
  with check (private.is_member_of(company_cnpj) or private.is_admin());

create policy "alerts_member_all" on public.alerts
  for all to authenticated
  using (private.is_member_of(company_cnpj) or private.is_admin())
  with check (private.is_member_of(company_cnpj) or private.is_admin());

create policy "accounts_member_all" on public.accounts
  for all to authenticated
  using (private.is_member_of(company_cnpj) or private.is_admin())
  with check (private.is_member_of(company_cnpj) or private.is_admin());

create policy "audit_select_admin" on public.audit_logs
  for select to authenticated using (private.is_admin());
create policy "audit_insert_authenticated" on public.audit_logs
  for insert to authenticated with check (auth.uid() = user_id or private.is_admin());

create policy "webhook_admin_all" on public.webhook_logs
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

revoke all on function public.handle_new_user() from public, anon, authenticated;
