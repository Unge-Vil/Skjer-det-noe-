-- Rich profile for municipalities, mirroring the organisation profile: a
-- rich-text description (jsonb doc + flattened plain-text mirror, both nb + en)
-- and public contact fields. Editable by municipality admins via the existing
-- "Admins update own municipality" policy (20260629000002_social_links.sql).

alter table public.municipalities
  add column description        text,
  add column description_en     text,
  add column description_doc    jsonb,
  add column description_doc_en jsonb,
  add column website            text,
  add column email              text,
  add column phone              text,
  add column address            text;
