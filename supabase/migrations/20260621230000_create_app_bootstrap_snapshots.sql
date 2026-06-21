create table if not exists public.app_bootstrap_snapshots (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_app_bootstrap_snapshot_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_app_bootstrap_snapshot_updated_at on public.app_bootstrap_snapshots;

create trigger set_app_bootstrap_snapshot_updated_at
before update on public.app_bootstrap_snapshots
for each row
execute function public.set_app_bootstrap_snapshot_updated_at();
