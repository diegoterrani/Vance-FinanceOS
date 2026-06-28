-- F2: signup honors the chosen plan from metadata (defaults to starter).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_invite_tenant uuid; v_role public.user_role; v_plan uuid;
begin
  v_invite_tenant := nullif(new.raw_user_meta_data->>'invite_tenant_id','')::uuid;
  begin v_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'analista');
  exception when others then v_role := 'analista'; end;

  if v_invite_tenant is not null then
    insert into public.profiles (id, email, name, tenant_id, role)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
            v_invite_tenant, v_role) on conflict (id) do nothing;
  else
    v_plan := coalesce(
      (select id from public.plans where code = coalesce(new.raw_user_meta_data->>'plan','starter') and active),
      (select id from public.plans where code='starter'));
    insert into public.tenants (name, status, plan_id, trial_ends_at)
    values (coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email,'@',1) || ' (Conta)'),
            'trialing', v_plan, now() + interval '14 days')
    returning id into v_tenant;
    insert into public.profiles (id, email, name, tenant_id, role)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
            v_tenant, 'admin') on conflict (id) do nothing;
    update public.tenants set owner_id = new.id where id = v_tenant;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
