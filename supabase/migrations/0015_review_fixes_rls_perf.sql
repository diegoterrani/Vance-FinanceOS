-- Review fixes: RLS perf. Wrap auth.uid()/helpers in (select ...) to evaluate
-- once per query (initplan), and split the "for all" write policies that
-- overlapped SELECT (multiple_permissive_policies). Logic unchanged.

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists tenants_select on public.tenants;
drop policy if exists tenants_admin on public.tenants;
drop policy if exists plans_read on public.plans;
drop policy if exists plans_admin on public.plans;
drop policy if exists companies_select on public.companies;
drop policy if exists companies_modify on public.companies;
drop policy if exists transactions_tenant on public.transactions;
drop policy if exists alerts_tenant on public.alerts;
drop policy if exists accounts_tenant on public.accounts;
drop policy if exists registries_tenant on public.registries;
drop policy if exists integration_tenant_admin on public.integration_settings;
drop policy if exists webhook_tenant_admin on public.webhook_logs;
drop policy if exists invites_select on public.team_invites;
drop policy if exists invites_modify on public.team_invites;
drop policy if exists audit_select on public.audit_logs;
drop policy if exists audit_insert on public.audit_logs;
drop policy if exists subscriptions_read on public.subscriptions;
drop policy if exists invoices_read on public.invoices;
drop policy if exists payments_read on public.payments;
drop policy if exists tickets_tenant on public.tickets;
drop policy if exists ticket_messages_select on public.ticket_messages;
drop policy if exists ticket_messages_insert on public.ticket_messages;
drop policy if exists usage_select on public.usage_events;
drop policy if exists usage_insert on public.usage_events;
drop policy if exists impersonation_super on public.impersonation_logs;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));

create policy tenants_select on public.tenants for select to authenticated using (id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy tenants_ins on public.tenants for insert to authenticated with check ((select private.is_super_admin()));
create policy tenants_upd on public.tenants for update to authenticated using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
create policy tenants_del on public.tenants for delete to authenticated using ((select private.is_super_admin()));

create policy plans_read on public.plans for select to anon, authenticated using (true);
create policy plans_ins on public.plans for insert to authenticated with check ((select private.is_super_admin()));
create policy plans_upd on public.plans for update to authenticated using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
create policy plans_del on public.plans for delete to authenticated using ((select private.is_super_admin()));

create policy companies_select on public.companies for select to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy companies_ins on public.companies for insert to authenticated with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy companies_upd on public.companies for update to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin())) with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy companies_del on public.companies for delete to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));

create policy transactions_tenant on public.transactions for all to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin())) with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy alerts_tenant on public.alerts for all to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin())) with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy accounts_tenant on public.accounts for all to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin())) with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy registries_tenant on public.registries for all to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin())) with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));

create policy integration_tenant_admin on public.integration_settings for all to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin())) with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy webhook_tenant_admin on public.webhook_logs for all to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin())) with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));

create policy invites_select on public.team_invites for select to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy invites_ins on public.team_invites for insert to authenticated with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy invites_upd on public.team_invites for update to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin())) with check ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy invites_del on public.team_invites for delete to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));

create policy audit_select on public.audit_logs for select to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy audit_insert on public.audit_logs for insert to authenticated with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));

create policy subscriptions_read on public.subscriptions for select to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy invoices_read on public.invoices for select to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));
create policy payments_read on public.payments for select to authenticated using ((tenant_id = (select private.my_tenant()) and (select private.is_tenant_admin())) or (select private.is_super_admin()));

create policy tickets_tenant on public.tickets for all to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin())) with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy ticket_messages_select on public.ticket_messages for select to authenticated using ((tenant_id = (select private.my_tenant()) and internal = false) or (select private.is_super_admin()));
create policy ticket_messages_insert on public.ticket_messages for insert to authenticated with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));

create policy usage_select on public.usage_events for select to authenticated using (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));
create policy usage_insert on public.usage_events for insert to authenticated with check (tenant_id = (select private.my_tenant()) or (select private.is_super_admin()));

create policy impersonation_super on public.impersonation_logs for all to authenticated using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
