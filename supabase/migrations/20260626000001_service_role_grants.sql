-- This project doesn't apply Supabase's default privileges, so the service_role
-- (used by trusted server tooling / admin scripts) had no table access. Grant it
-- full access to the public schema, plus default privileges for future objects.
-- service_role also has BYPASSRLS, so it acts as a full admin backend role.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
