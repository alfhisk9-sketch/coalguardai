-- 0005_inspections.sql
create type inspection_status as enum ('SCHEDULED','IN_PROGRESS','SUBMITTED','REVIEWED','APPROVED','REJECTED');
create type severity_level as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type sync_status as enum ('SYNCED','PENDING','CONFLICT');
create type corrective_source as enum ('INSPECTION','INCIDENT','COMPLIANCE');

create table inspection_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mine_type mine_type,
  items jsonb not null default '[]'
);

create table inspections (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  inspector_id uuid not null references profiles(id),
  template_id uuid references inspection_templates(id),
  inspection_type text not null,
  scheduled_date date,
  actual_date date,
  latitude double precision,
  longitude double precision,
  status inspection_status not null default 'SCHEDULED',
  client_operation_id uuid,
  client_created_at timestamptz,
  sync_status sync_status not null default 'SYNCED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_inspections_client_op on inspections(client_operation_id) where client_operation_id is not null;
create index idx_inspections_mine_status on inspections(mine_id, status);
create index idx_inspections_inspector on inspections(inspector_id);

create table inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  label text not null,
  response text,
  is_compliant boolean
);

create table inspection_observations (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  description text not null,
  severity severity_level not null,
  latitude double precision,
  longitude double precision,
  photo_document_id uuid, -- FK added in 0012
  client_operation_id uuid,
  client_created_at timestamptz,
  sync_status sync_status not null default 'SYNCED',
  created_at timestamptz not null default now()
);
create unique index uq_observations_client_op on inspection_observations(client_operation_id) where client_operation_id is not null;
create index idx_observations_inspection on inspection_observations(inspection_id);
create index idx_observations_severity on inspection_observations(severity);

create table corrective_actions (
  id uuid primary key default gen_random_uuid(),
  source_type corrective_source not null,
  source_id uuid not null,
  issue text not null,
  responsible_user_id uuid references profiles(id),
  deadline date,
  priority priority_level not null default 'MEDIUM',
  status action_status not null default 'OPEN',
  completion_evidence_id uuid, -- FK added in 0012
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_corrective_actions_source on corrective_actions(source_type, source_id);
create index idx_corrective_actions_status on corrective_actions(status);

create trigger trg_inspections_updated before update on inspections for each row execute function fn_set_updated_at();
create trigger trg_corrective_updated before update on corrective_actions for each row execute function fn_set_updated_at();
