-- rls_auto_enable is an event-trigger function (auto-enables RLS on new public
-- tables). It is never called via the API; event triggers fire regardless of
-- the caller's EXECUTE grant, so revoking it is safe and clears the lint.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
