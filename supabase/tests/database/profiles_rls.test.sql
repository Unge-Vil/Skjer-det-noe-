begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'platform-admin@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

update public.profiles
set is_platform_admin = true
where id = '10000000-0000-0000-0000-000000000001';

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'update'),
  'authenticated users can update full_name'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.profiles',
    'is_platform_admin',
    'update'
  ),
  'authenticated users cannot update is_platform_admin directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select lives_ok(
  $$update public.profiles set full_name = 'Member' where id = auth.uid()$$,
  'a user can update their own safe profile fields'
);

select throws_ok(
  $$update public.profiles set is_platform_admin = true where id = auth.uid()$$,
  '42501',
  'permission denied for table profiles',
  'a user cannot grant themselves platform access'
);

select throws_ok(
  $$select public.set_platform_admin(auth.uid(), true)$$,
  'P0001',
  'Not authorized',
  'a non-admin cannot use the platform-admin RPC'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.set_platform_admin(
    '10000000-0000-0000-0000-000000000002',
    true
  )$$,
  'a platform admin can grant platform access through the RPC'
);

reset role;

select is(
  (
    select is_platform_admin
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000002'
  ),
  true,
  'the controlled platform-admin update is persisted'
);

select * from finish();
rollback;