-- local_test_setup.sql
-- FOR LOCAL/CI SCHEMA VALIDATION ONLY. Real Supabase projects already provide the `auth` schema
-- and `auth.uid()`. This file stubs just enough of that surface to let migrations 0001-0011
-- apply and RLS policies be exercised against a plain Postgres instance in CI.
-- DO NOT run this against a real Supabase project.

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- test-only session variable standing in for the JWT-derived uid Supabase provides natively
create or replace function auth.uid() returns uuid as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$ language sql stable;
