-- 0002_organizations.sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subsidiaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, code)
);
create index idx_subsidiaries_org on subsidiaries(organization_id);

create table regions (
  id uuid primary key default gen_random_uuid(),
  subsidiary_id uuid not null references subsidiaries(id),
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subsidiary_id, code)
);
create index idx_regions_subsidiary on regions(subsidiary_id);

create type mine_type as enum ('OPEN_CAST','UNDERGROUND','MIXED');
create type mine_status as enum ('ACTIVE','INACTIVE');

create table mines (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references regions(id),
  name text not null,
  code text not null unique,
  mine_type mine_type not null,
  latitude double precision,
  longitude double precision,
  status mine_status not null default 'ACTIVE',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_mines_region on mines(region_id);
create index idx_mines_status on mines(status);

create trigger trg_org_updated before update on organizations for each row execute function fn_set_updated_at();
create trigger trg_sub_updated before update on subsidiaries for each row execute function fn_set_updated_at();
create trigger trg_region_updated before update on regions for each row execute function fn_set_updated_at();
create trigger trg_mine_updated before update on mines for each row execute function fn_set_updated_at();
