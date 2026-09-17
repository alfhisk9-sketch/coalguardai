-- 0006_incidents_safety.sql
create type incident_status as enum ('REPORTED','UNDER_INVESTIGATION','RESOLVED','CLOSED');
create type hazard_status as enum ('OPEN','MITIGATED','CLOSED');

create table incident_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  incident_type_id uuid references incident_types(id),
  occurred_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  description text not null,
  severity severity_level not null,
  reported_by uuid references profiles(id),
  status incident_status not null default 'REPORTED',
  client_operation_id uuid,
  client_created_at timestamptz,
  sync_status sync_status not null default 'SYNCED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_incidents_client_op on incidents(client_operation_id) where client_operation_id is not null;
create index idx_incidents_mine_status on incidents(mine_id, status);

create table incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  document_id uuid -- FK added in 0012
);

create table safety_observations (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  observed_by uuid references profiles(id),
  description text not null,
  latitude double precision,
  longitude double precision,
  severity severity_level not null,
  status text not null default 'OPEN',
  client_operation_id uuid,
  client_created_at timestamptz,
  sync_status sync_status not null default 'SYNCED',
  created_at timestamptz not null default now()
);
create unique index uq_safety_obs_client_op on safety_observations(client_operation_id) where client_operation_id is not null;

create table hazards (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  title text not null,
  description text,
  risk_level severity_level not null,
  status hazard_status not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table risk_assessments (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  hazard_id uuid references hazards(id),
  assessed_by uuid references profiles(id),
  likelihood int not null check (likelihood between 1 and 5),
  severity int not null check (severity between 1 and 5),
  risk_score int generated always as (likelihood * severity) stored,
  notes text,
  created_at timestamptz not null default now()
);

create trigger trg_incidents_updated before update on incidents for each row execute function fn_set_updated_at();
