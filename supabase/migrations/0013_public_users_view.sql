-- 0013_public_users_view.sql
-- Compatibility view mapping public.users to public.profiles
create or replace view public.users as
  select
    id,
    full_name,
    email,
    phone,
    contractor_id,
    is_active,
    created_at,
    updated_at
  from public.profiles;

comment on view public.users is 'Compatibility view aliasing public.profiles as public.users for integrations and queries expecting public.users.';
