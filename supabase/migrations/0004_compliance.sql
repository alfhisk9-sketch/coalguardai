-- 0004_compliance.sql
create type compliance_frequency as enum ('ONE_TIME','DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUAL');
create type priority_level as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type compliance_status as enum ('COMPLIANT','DUE_SOON','OVERDUE','NON_COMPLIANT','UNDER_REVIEW','NOT_APPLICABLE');
create type action_status as enum ('OPEN','IN_PROGRESS','COMPLETED','VERIFIED','OVERDUE');

create table compliance_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id),
  category_id uuid references compliance_categories(id),
  title text not null,
  description text,
  regulatory_authority text,
  frequency compliance_frequency not null,
  responsible_role_id uuid references roles(id),
  responsible_user_id uuid references profiles(id),
  priority priority_level not null default 'MEDIUM',
  is_demo_content boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_compliance_req_mine on compliance_requirements(mine_id);

create table compliance_records (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references compliance_requirements(id),
  mine_id uuid not null references mines(id),
  due_date date not null,
  completed_date date,
  status compliance_status not null default 'UNDER_REVIEW',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_compliance_records_mine_status on compliance_records(mine_id, status);
create index idx_compliance_records_due on compliance_records(due_date);

create table compliance_evidence (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references compliance_records(id) on delete cascade,
  document_id uuid, -- FK added in 0012 (documents table)
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table compliance_actions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references compliance_records(id) on delete cascade,
  description text not null,
  assigned_to uuid references profiles(id),
  deadline date,
  status action_status not null default 'OPEN',
  escalated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_comp_req_updated before update on compliance_requirements for each row execute function fn_set_updated_at();
create trigger trg_comp_rec_updated before update on compliance_records for each row execute function fn_set_updated_at();
create trigger trg_comp_act_updated before update on compliance_actions for each row execute function fn_set_updated_at();
