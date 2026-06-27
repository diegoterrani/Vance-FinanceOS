-- Seed demo data + a confirmed admin login, and auto-enroll new signups into
-- existing companies (sandbox/homologation convenience).

create extension if not exists pgcrypto with schema extensions;

-- accounts.last_sync holds free-form display strings in the app.
alter table public.accounts alter column last_sync type text using last_sync::text;

-- Signup trigger: set name/role from metadata + enroll into all companies.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare c text;
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'analista')
  )
  on conflict (id) do nothing;

  for c in select cnpj from public.companies loop
    insert into public.company_members (user_id, company_cnpj, role)
    values (new.id, c, 'admin')
    on conflict (user_id, company_cnpj) do nothing;
  end loop;

  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Demo companies
insert into public.companies (cnpj, razao_social, nome_fantasia, regime, min_balance_alert, timezone, certificate_uploaded, certificate_expiry)
values
  ('12345678000199', 'Vance Soluções de Crescimento LTDA', 'VANCE MATRIZ', 'Simples Nacional', 10000.00, 'America/Sao_Paulo', true, '2027-06-21'),
  ('98765432000100', 'Vance Distribuidora de Ativos Importados S.A.', 'VANCE DISTRIBUIDORA', 'Lucro Real', 25000.00, 'America/Sao_Paulo', false, null)
on conflict (cnpj) do nothing;

-- Confirmed demo admin login. Password: VanceDemo#2026  (change after first login).
-- NOTE: GoTrue scans the *_token columns into Go strings and cannot handle
-- NULL, so they MUST be '' (empty string), not NULL.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'diego.terrani@gmail.com',
  extensions.crypt('VanceDemo#2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Diego Terrani","role":"admin"}'::jsonb,
  now(), now(),
  '', '', '', ''
where not exists (select 1 from auth.users where email = 'diego.terrani@gmail.com');

insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u
where u.email = 'diego.terrani@gmail.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- Demo transactions (outflow stored negative to match the UI convention)
insert into public.transactions (company_cnpj, description, bank, bank_code, direction, status, value, date, reference, category, score)
values
  ('12345678000199','PIX RECEBIDO CONTRATO MENSAL SUITE','XP Investimentos','102','inflow','matched',18200.00,'2026-06-21','PIX EM ENTRADA RECORRENTE','Contratos Clientes',0.98),
  ('12345678000199','PAGAMENTO FORNECEDOR NUVEM HOSTING','Itaú Unibanco S.A.','341','outflow','matched',-4400.00,'2026-06-20','AWS HOSTING CLOUD RUN DEBITO','Sistemas e Softwares',0.91),
  ('12345678000199','TRANSFERENCIA TED ENTRADA ADIANTAMENTO','Itaú Unibanco S.A.','341','inflow','pending',12500.00,'2026-06-21','TED STRIPE PAYMENTS INBOUND','Contratos Clientes',0.78),
  ('98765432000100','IMPOSTO GUIA DAS RECOLHIMENTO MENSAL','Banco do Brasil S.A.','001','outflow','matched',-10300.00,'2026-06-19','PAGAMENTO GUIA SIMPLES DAS SFN','Impostos e Contribuições',0.99),
  ('98765432000100','RETIRADA PRO LABORE SOCIO INTERNO','Itaú Unibanco S.A.','341','outflow','pending',-8500.00,'2026-06-18','REMUNERACAO PROLABORE MENSAL','Folha de Pagamento',0.65),
  ('98765432000100','RENDIMENTOS APLICAÇÃO CDI DIÁRIA','XP Investimentos','102','inflow','matched',1840.00,'2026-06-17','CDI XP INVESTIMENTOS CDB LIQUIDO','Juros e Rendimentos',0.95)
on conflict do nothing;

insert into public.alerts (company_cnpj, title, description, level, status, category, date)
values
  ('12345678000199','Saldo Itaú abaixo do limite de segurança','O saldo sincronizado via API Bancária Direta (R$ 4.200,00) está inferior à margem parametrizada de R$ 10.000,00.','critical','active','API Bancária','2026-06-21'),
  ('98765432000100','Duplicata Fornecedor vencendo hoje','Título financeiro Silveira Express (R$ 3.100,00) registra vencimento em 21/06 sem conciliação correspondente no extrato bancário.','high','active','Faturamento','2026-06-21'),
  ('12345678000199','Sincronização de API Bancária PJ ativa','Contas bancárias sincronizadas perfeitamente com os endpoints de produção à 1 hora atrás.','info','active','Sincronização','2026-06-21')
on conflict do nothing;

insert into public.accounts (company_cnpj, name, type, bank_name, balance, sync_status, last_sync)
values
  ('12345678000199','Itaú Unibanco S.A.','checking','Itaú Corp',4200.00,'success','06:00 Hoje'),
  ('12345678000199','XP Investimentos','investment','XP Corporate',44120.00,'success','06:00 Hoje'),
  ('98765432000100','Nubank PJ','checking','Nubank Co-Corp',15300.00,'success','06:00 Hoje'),
  ('12345678000199','Caixa Interno em Espécie','cash','Caixa Físico',3800.00,'success','Manual')
on conflict do nothing;

insert into public.webhook_logs (url, event, status, duration, status_code)
values
  ('https://meu-sistema-erp.com/webhooks/vance','cnab.processed','success',154,200),
  ('https://meu-sistema-erp.com/webhooks/vance','balance.alert','success',89,200),
  ('https://meu-sistema-erp.com/webhooks/vance','cnab.processed','failed',320,502)
on conflict do nothing;
