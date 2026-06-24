-- Table-level privileges for the API roles.
--
-- RLS policies decide which *rows* are visible, but PostgREST also requires
-- SQL GRANTs for table access. This project doesn't auto-grant public tables to
-- anon/authenticated, so the public read paths (and the SECURITY INVOKER
-- nearby_* RPCs) were hitting "permission denied". Grant SELECT explicitly;
-- RLS continues to restrict rows to published listings / reference data.

grant usage on schema public to anon, authenticated;

grant select on
  public.municipalities,
  public.categories,
  public.organizations,
  public.activities,
  public.events
to anon, authenticated;

grant select on public.municipalities_view to anon, authenticated;
