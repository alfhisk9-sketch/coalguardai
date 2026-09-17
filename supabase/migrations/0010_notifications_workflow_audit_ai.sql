-- 0010_notifications_workflow_audit_ai.sql

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_unread on notifications(user_id, is_read);

create table notification_rules (
  id uuid primary key default gen_random_uuid(),
  trigger_key text not null unique,
  description text,
  is_active boolean not null default true
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to uuid references profiles(id),
  related_entity_type text,
  related_entity_id uuid,
  due_date date,
  status text not null default 'OPEN'
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  requested_by uuid references profiles(id),
  approver_id uuid references profiles(id),
  status text not null default 'PENDING',
  decided_at timestamptz,
  comment text
);

create table workflow_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  from_state text,
  to_state text not null,
  actor_id uuid references profiles(id),
  occurred_at timestamptz not null default now()
);
create index idx_workflow_events_entity on workflow_events(entity_type, entity_id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  role_key text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address inet,
  occurred_at timestamptz not null default now()
);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_actor on audit_logs(actor_id);

-- AI (interfaces populated by Account 3; Account 1 ships tables + stub-shaped rows only)
create table risk_scores (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid references mines(id),
  entity_type text,
  entity_id uuid,
  score numeric,
  factors jsonb,
  computed_at timestamptz not null default now(),
  model_version text
);

create table anomaly_events (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid references mines(id),
  entity_type text,
  entity_id uuid,
  description text,
  confidence numeric,
  detected_at timestamptz not null default now(),
  status text not null default 'NEW'
);

create table ai_analysis_results (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  analysis_type text not null,
  result jsonb not null,
  model_version text,
  created_at timestamptz not null default now()
);

create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid references mines(id),
  entity_type text,
  entity_id uuid,
  recommendation text not null,
  priority priority_level not null default 'MEDIUM',
  status text not null default 'NEW'
);
