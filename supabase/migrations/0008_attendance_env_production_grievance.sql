-- 0008_attendance_env_production_grievance.sql
create type attendance_status as enum ('PRESENT','ABSENT','HALF_DAY','ON_LEAVE');
create type attendance_source as enum ('MANUAL','MOBILE_APP');

create table worker_attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references contractor_workers(id),
  mine_id uuid not null references mines(id),
  attendance_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status attendance_status not null,
  latitude double precision,
  longitude double precision,
  source attendance_source not null default 'MANUAL',
  recorded_by uuid references profiles(id),
  client_operation_id uuid,
  sync_status sync_status not null default 'SYNCED',
  created_at timestamptz not null default now(),
  unique(worker_id, attendance_date)
);
create unique index uq_attendance_client_op on worker_attendance(client_operation_id) where client_operation_id is not null;

create type env_parameter as enum ('AIR_QUALITY','DUST','WATER','NOISE','LAND');
create type env_reading_status as enum ('NORMAL','WARNING','EXCEEDED');

create table environmental_monitoring_points (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  name text not null,
  latitude double precision,
  longitude double precision,
  parameter_type env_parameter not null
);

create table environmental_readings (
  id uuid primary key default gen_random_uuid(),
  monitoring_point_id uuid not null references environmental_monitoring_points(id) on delete cascade,
  parameter_type env_parameter not null,
  value numeric not null,
  unit text not null,
  threshold_value numeric,
  status env_reading_status not null default 'NORMAL',
  recorded_at timestamptz not null default now(),
  recorded_by uuid references profiles(id),
  evidence_document_id uuid, -- FK added in 0012
  is_demo_content boolean not null default true
);
create index idx_env_readings_point on environmental_readings(monitoring_point_id);

create type production_status as enum ('DRAFT','SUBMITTED','APPROVED');

create table production_reports (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  period_start date not null,
  period_end date not null,
  target_quantity numeric not null,
  actual_quantity numeric,
  unit text not null default 'tonnes',
  status production_status not null default 'DRAFT',
  submitted_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table operational_indicators (
  id uuid primary key default gen_random_uuid(),
  production_report_id uuid not null references production_reports(id) on delete cascade,
  indicator_name text not null,
  value numeric,
  unit text
);

create type grievance_priority as enum ('LOW','MEDIUM','HIGH');
create type grievance_status as enum ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');

create table grievances (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  submitted_by uuid references profiles(id),
  category text,
  title text not null,
  description text,
  priority grievance_priority not null default 'MEDIUM',
  status grievance_status not null default 'OPEN',
  assigned_to uuid references profiles(id),
  resolution text,
  is_confidential boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table grievance_evidence (
  id uuid primary key default gen_random_uuid(),
  grievance_id uuid not null references grievances(id) on delete cascade,
  document_id uuid -- FK added in 0012
);

create trigger trg_grievances_updated before update on grievances for each row execute function fn_set_updated_at();
