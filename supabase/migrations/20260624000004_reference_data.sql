-- Reference data: categories and a starter set of municipalities.
--
-- Municipalities cover Haugalandet + nearby Rogaland (Unge Vil's core area);
-- the full set of Norwegian kommuner can be imported later. Idempotent via
-- ON CONFLICT so re-runs are safe.

-- Slugs/icons mirror the design system's CATEGORIES (Lucide icon names).
insert into public.categories (slug, name, icon, sort_order) values
  ('gaming',   'Gaming',       'gamepad-2',      10),
  ('music',    'Musikk',       'music',          20),
  ('film',     'Film',         'clapperboard',   30),
  ('sports',   'Sport',        'volleyball',     40),
  ('outdoor',  'Friluftsliv',  'tent-tree',      50),
  ('creative', 'Skapende',     'palette',        60),
  ('social',   'Møteplass',    'users-round',    70),
  ('courses',  'Kurs',         'graduation-cap', 80),
  ('club',     'Ungdomsklubb', 'house-heart',    90)
on conflict (slug) do nothing;

insert into public.municipalities (kommunenummer, name, county, slug, center) values
  ('1149', 'Karmøy',     'Rogaland', 'karmoy',     extensions.st_setsrid(extensions.st_makepoint(5.3015, 59.2792), 4326)),
  ('1106', 'Haugesund',  'Rogaland', 'haugesund',  extensions.st_setsrid(extensions.st_makepoint(5.2680, 59.4138), 4326)),
  ('1146', 'Tysvær',     'Rogaland', 'tysvar',     extensions.st_setsrid(extensions.st_makepoint(5.4500, 59.3667), 4326)),
  ('1145', 'Bokn',       'Rogaland', 'bokn',       extensions.st_setsrid(extensions.st_makepoint(5.4500, 59.2167), 4326)),
  ('1160', 'Vindafjord', 'Rogaland', 'vindafjord', extensions.st_setsrid(extensions.st_makepoint(5.9300, 59.5500), 4326)),
  ('1151', 'Utsira',     'Rogaland', 'utsira',     extensions.st_setsrid(extensions.st_makepoint(4.8767, 59.3072), 4326)),
  ('4612', 'Sveio',      'Vestland', 'sveio',      extensions.st_setsrid(extensions.st_makepoint(5.3500, 59.5500), 4326)),
  ('1103', 'Stavanger',  'Rogaland', 'stavanger',  extensions.st_setsrid(extensions.st_makepoint(5.7331, 58.9700), 4326)),
  ('1108', 'Sandnes',    'Rogaland', 'sandnes',    extensions.st_setsrid(extensions.st_makepoint(5.7352, 58.8524), 4326))
on conflict (kommunenummer) do nothing;
