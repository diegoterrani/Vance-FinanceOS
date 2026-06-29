-- Review fixes: MP webhook idempotency + FK covering indexes.
create unique index if not exists payments_mp_payment_uniq on public.payments(mp_payment_id) where mp_payment_id is not null;
create unique index if not exists invoices_mp_payment_uniq on public.invoices(mp_payment_id) where mp_payment_id is not null;

create index if not exists impersonation_logs_super_idx on public.impersonation_logs(super_admin_id);
create index if not exists integration_settings_updatedby_idx on public.integration_settings(updated_by);
create index if not exists invoices_subscription_idx on public.invoices(subscription_id);
create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists registries_createdby_idx on public.registries(created_by);
create index if not exists subscriptions_plan_idx on public.subscriptions(plan_id);
create index if not exists team_invites_invitedby_idx on public.team_invites(invited_by);
create index if not exists tenants_plan_idx on public.tenants(plan_id);
create index if not exists ticket_messages_author_idx on public.ticket_messages(author_id);
create index if not exists ticket_messages_tenant_idx2 on public.ticket_messages(tenant_id);
create index if not exists tickets_assignee_idx on public.tickets(assignee);
create index if not exists tickets_createdby_idx on public.tickets(created_by);
create index if not exists transactions_createdby_idx on public.transactions(created_by);
