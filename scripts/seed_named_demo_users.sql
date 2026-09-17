-- seed_named_demo_users.sql — Idempotent creation and mapping of the 6 named SIH team demo accounts
-- Project: CoalGuard AI (SIH26024)
-- Team Members: Alfhi, Rabbani, Akshay, Krishna, Koushik, Hema

-- 1. Insert into auth.users (GoTrue)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('a0000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alfhi.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Alfhi"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rabbani.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rabbani"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'akshay.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Akshay"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'krishna.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Krishna"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'koushik.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Koushik"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hema.demo@sih26024.test',
   crypt('demo123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Hema"}'::jsonb,
   now(), now(), '', '', '', '')
on conflict (id) do update set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = crypt('demo123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 2. Insert into auth.identities
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  id,
  id,
  json_build_object('sub', id, 'email', email),
  'email',
  id,
  now(),
  now(),
  now()
from auth.users
where email like '%@sih26024.test'
on conflict (provider, provider_id) do nothing;

-- 3. Profiles (with real display names)
insert into profiles (id, full_name, email, is_active) values
  ('a0000000-0000-0000-0000-000000000601', 'Alfhi', 'alfhi.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000602', 'Rabbani', 'rabbani.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000603', 'Akshay', 'akshay.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000604', 'Krishna', 'krishna.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000606', 'Hema', 'hema.demo@sih26024.test', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  is_active = true;

-- Koushik has contractor association (Alpha Mining Services)
insert into profiles (id, full_name, email, contractor_id, is_active) values
  ('a0000000-0000-0000-0000-000000000605', 'Koushik', 'koushik.demo@sih26024.test', 'a0000000-0000-0000-0000-000000000110', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  contractor_id = excluded.contractor_id,
  is_active = true;

-- 4. User Roles Mapping
-- Roles:
-- SUPER_ADMIN:     a0000000-0000-0000-0000-000000000040 (mine_id: null)
-- CORPORATE_ADMIN: a0000000-0000-0000-0000-000000000041 (mine_id: null)
-- MINE_MANAGER:    a0000000-0000-0000-0000-000000000042 (mine_id: Shakti)
-- INSPECTOR:       a0000000-0000-0000-0000-000000000043 (mine_id: Shakti)
-- CONTRACTOR:      a0000000-0000-0000-0000-000000000044 (mine_id: null)
-- REGULATOR:       a0000000-0000-0000-0000-000000000045 (mine_id: Shakti)

delete from user_roles where user_id in (
  'a0000000-0000-0000-0000-000000000601',
  'a0000000-0000-0000-0000-000000000602',
  'a0000000-0000-0000-0000-000000000603',
  'a0000000-0000-0000-0000-000000000604',
  'a0000000-0000-0000-0000-000000000605',
  'a0000000-0000-0000-0000-000000000606'
);

insert into user_roles (user_id, role_id, mine_id) values
  ('a0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-000000000040', null),                                   -- Alfhi (Super Admin)
  ('a0000000-0000-0000-0000-000000000602', 'a0000000-0000-0000-0000-000000000041', null),                                   -- Rabbani (Corporate Admin)
  ('a0000000-0000-0000-0000-000000000603', 'a0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000030'), -- Akshay (Mine Manager - Shakti)
  ('a0000000-0000-0000-0000-000000000604', 'a0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000030'), -- Krishna (Inspector - Shakti)
  ('a0000000-0000-0000-0000-000000000605', 'a0000000-0000-0000-0000-000000000044', null),                                   -- Koushik (Contractor)
  ('a0000000-0000-0000-0000-000000000606', 'a0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000030'); -- Hema (Regulator - Shakti)

-- 5. Associate existing demonstration inspection with Krishna (Inspector)
update inspections
set inspector_id = 'a0000000-0000-0000-0000-000000000604'
where id = 'a0000000-0000-0000-0000-000000000230';
