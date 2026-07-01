-- A municipality's own statutory accessibility declaration (tilgjengelighets-
-- erklæring), typically a uustatus.no URL. Shown on the public kommune page and
-- editable by municipality admins (existing "Admins update own municipality"
-- policy already covers writes).

alter table public.municipalities
  add column accessibility_url text;
