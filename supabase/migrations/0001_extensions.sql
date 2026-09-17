-- 0001_extensions.sql
create extension if not exists pgcrypto;

-- generic updated_at trigger reused by every table
create or replace function fn_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
