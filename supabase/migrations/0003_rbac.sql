-- 0003_rbac.sql
-- NOTE: references auth.users(id), which exists natively in Supabase.
-- For local/non-Supabase testing, see scripts/local_test_setup.sql which stubs the auth schema.

create type role_key as enum ('SUPER_ADMIN','CORPORATE_ADMIN','MINE_MANAGER','INSPECTOR','CONTRACTOR','REGULATOR');

create table roles (
  id uuid primary key default gen_random_uuid(),
  key role_key not null unique,
  name text not null
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- contractors table is created in 0007; forward-declare via deferred FK added there.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  contractor_id uuid, -- FK added in 0007 after contractors table exists
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- INTENTIONALLY NO mine_id COLUMN ON profiles. Mine scope lives solely in user_roles (v2 fix, see SECURITY.md 4b).

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references roles(id),
  mine_id uuid, -- FK added in 0002-dependent migration below; null = org-wide (SUPER_ADMIN/CORPORATE_ADMIN)
  created_at timestamptz not null default now(),
  unique(user_id, role_id, mine_id)
);
alter table user_roles add constraint fk_user_roles_mine foreign key (mine_id) references mines(id);
create index idx_user_roles_user on user_roles(user_id);
create index idx_user_roles_mine on user_roles(mine_id);

create trigger trg_profiles_updated before update on profiles for each row execute function fn_set_updated_at();

-- Single source of truth helper used by every RLS policy and by API middleware logic.
create or replace function fn_user_has_mine_access(target_mine_id uuid) returns boolean as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and (
        r.key in ('SUPER_ADMIN','CORPORATE_ADMIN')
        or ur.mine_id = target_mine_id
      )
  );
$$ language sql stable security definer;

create or replace function fn_user_has_permission(perm_key text) returns boolean as $$
  select exists (
    select 1 from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.key = perm_key
  );
$$ language sql stable security definer;
