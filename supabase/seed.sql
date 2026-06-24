-- Local development seed data (applied by `supabase db reset`).
-- Sample organizations, recurring activities and events around Karmøy so the
-- app shows real-looking content locally. Not applied to production.

-- Organizations
insert into public.organizations (name, slug, description, website, municipality_id, address, location)
select * from (
  values
    ('Kopervik Idrettslag', 'kopervik-il',
      'Breddeidrett for barn og ungdom i Kopervik.',
      'https://example.org/kopervik-il',
      (select id from public.municipalities where kommunenummer = '1149'),
      'Idrettsvegen 1, 4250 Kopervik',
      extensions.st_setsrid(extensions.st_makepoint(5.3015, 59.2818), 4326)::extensions.geography),
    ('Haugesund Kulturhus', 'haugesund-kulturhus',
      'Konserter, teater og kulturarrangement i sentrum.',
      'https://example.org/haugesund-kulturhus',
      (select id from public.municipalities where kommunenummer = '1106'),
      'Strandgata 87, 5528 Haugesund',
      extensions.st_setsrid(extensions.st_makepoint(5.2685, 59.4106), 4326)::extensions.geography),
    ('Ungdomsklubben Åkra', 'ungdomsklubben-akra',
      'Fritidsklubb og møteplass for ungdom på Åkra.',
      null,
      (select id from public.municipalities where kommunenummer = '1149'),
      'Åkrehamn, 4270 Åkrehamn',
      extensions.st_setsrid(extensions.st_makepoint(5.1900, 59.2560), 4326)::extensions.geography)
) as o(name, slug, description, website, municipality_id, address, location)
on conflict (slug) do nothing;

-- Recurring activities
insert into public.activities
  (title, slug, description, organization_id, category_id, municipality_id,
   address, location, weekday, start_time, end_time, recurrence_note,
   age_min, age_max, price)
select * from (
  values
    ('Fotballtrening G13', 'fotballtrening-g13',
      'Ukentlig fotballtrening for gutter 13 år.',
      (select id from public.organizations where slug = 'kopervik-il'),
      (select id from public.categories where slug = 'sports'),
      (select id from public.municipalities where kommunenummer = '1149'),
      'Kopervik stadion', extensions.st_setsrid(extensions.st_makepoint(5.3020, 59.2820), 4326)::extensions.geography,
      2::smallint, time '17:30', time '19:00', 'Hver tirsdag i sesong',
      12::smallint, 14::smallint, 'Medlemskontingent'),
    ('Ungdomskveld', 'ungdomskveld-akra',
      'Åpen klubbkveld med biljard, gaming og kafé.',
      (select id from public.organizations where slug = 'ungdomsklubben-akra'),
      (select id from public.categories where slug = 'club'),
      (select id from public.municipalities where kommunenummer = '1149'),
      'Åkra fritidsklubb', extensions.st_setsrid(extensions.st_makepoint(5.1905, 59.2562), 4326)::extensions.geography,
      5::smallint, time '18:00', time '22:00', 'Hver fredag',
      13::smallint, 18::smallint, 'Gratis')
) as a(title, slug, description, organization_id, category_id, municipality_id,
       address, location, weekday, start_time, end_time, recurrence_note,
       age_min, age_max, price)
on conflict (slug) do nothing;

-- One-off events
insert into public.events
  (title, slug, description, organization_id, category_id, municipality_id,
   address, location, starts_at, ends_at, age_min, age_max, price)
select * from (
  values
    ('Høstkonsert', 'hostkonsert-2026',
      'Lokale band spiller på den årlige høstkonserten.',
      (select id from public.organizations where slug = 'haugesund-kulturhus'),
      (select id from public.categories where slug = 'music'),
      (select id from public.municipalities where kommunenummer = '1106'),
      'Haugesund Kulturhus', extensions.st_setsrid(extensions.st_makepoint(5.2685, 59.4106), 4326)::extensions.geography,
      now() + interval '14 days', now() + interval '14 days' + interval '3 hours',
      13::smallint, null::smallint, '150 kr')
) as e(title, slug, description, organization_id, category_id, municipality_id,
       address, location, starts_at, ends_at, age_min, age_max, price)
on conflict (slug) do nothing;
