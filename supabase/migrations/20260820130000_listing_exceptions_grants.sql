-- listing_exceptions (20260820112306) enabled RLS with correct policies but
-- never granted table-level privileges, so PostgREST denied all access:
-- every activity/event detail page 404'd for the public and the admin
-- ExceptionManager could not read or write. The "Members manage" policy
-- predicate also resolved to always-true because the unqualified
-- organization_id bound to organization_members instead of the table column.

grant select on public.listing_exceptions to anon, authenticated;
grant insert, update, delete on public.listing_exceptions to authenticated;

drop policy "Members manage organisation listing exceptions" on public.listing_exceptions;

create policy "Members manage organisation listing exceptions"
  on public.listing_exceptions for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
