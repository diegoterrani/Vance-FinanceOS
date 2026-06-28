-- F1 data migration (applied via MCP). Demo customer tenant + Iron Security super-admin.
-- NOTE: the super-admin password below is a PLACEHOLDER. The real temp password was
-- applied out-of-band (repo is public) and must be changed on first login.

insert into public.tenants (name, status, plan_id, trial_ends_at)
values ('Vance Demo (Cliente)', 'trialing', (select id from public.plans where code='pro'), now() + interval '14 days');
update public.companies set tenant_id = (select id from public.tenants where name='Vance Demo (Cliente)') where tenant_id is null;
update public.profiles set tenant_id = (select id from public.tenants where name='Vance Demo (Cliente)'), role='admin'
  where email='diego.terrani@gmail.com';
update public.tenants set owner_id = (select id from public.profiles where email='diego.terrani@gmail.com')
  where name='Vance Demo (Cliente)';
update public.transactions x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;
update public.alerts x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;
update public.accounts x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;
update public.integration_settings x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;
update public.team_invites x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;
update public.registries x set tenant_id=c.tenant_id from public.companies c where x.company_cnpj=c.cnpj and x.tenant_id is null;

insert into public.tenants (name, status, plan_id)
values ('Iron Security', 'active', (select id from public.plans where code='enterprise'));

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
  confirmation_token,recovery_token,email_change,email_change_token_new)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(),'authenticated','authenticated',
  'vance@iron-security.com', extensions.crypt('<TEMP_PASSWORD_SET_OUT_OF_BAND>', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Vance Admin"}'::jsonb, now(), now(), '','','',''
where not exists (select 1 from auth.users where email='vance@iron-security.com');

insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u where u.email='vance@iron-security.com'
  and not exists (select 1 from auth.identities i where i.user_id=u.id and i.provider='email');

update public.profiles set tenant_id=(select id from public.tenants where name='Iron Security'),
  role='admin', is_super_admin=true where email='vance@iron-security.com';
delete from public.tenants t where t.owner_id=(select id from auth.users where email='vance@iron-security.com')
  and t.name <> 'Iron Security';
update public.tenants set owner_id=(select id from auth.users where email='vance@iron-security.com') where name='Iron Security';
