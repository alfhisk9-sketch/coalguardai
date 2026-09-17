-- live_seed.sql — Comprehensive Idempotent Seed for Live Supabase Instance
-- Project: CoalGuard AI (SIH26024)
-- Ministry of Coal / Coal India Limited

-- ============ ORG HIERARCHY ============
insert into organizations (id, name, code) values
  ('a0000000-0000-0000-0000-000000000001', 'Coal India Limited (Demo)', 'CIL-DEMO')
on conflict (id) do nothing;

insert into subsidiaries (id, organization_id, name, code) values
  ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'South Eastern Coalfields (Demo)', 'SECL-DEMO')
on conflict (id) do nothing;

insert into regions (id, subsidiary_id, name, code) values
  ('a0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000010', 'Region North (Demo)', 'RN-DEMO'),
  ('a0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000010', 'Region South (Demo)', 'RS-DEMO')
on conflict (id) do nothing;

insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000020', 'Shakti Open Cast Mine',   'SHK-DEMO', 'OPEN_CAST',   23.2599, 82.3616, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000020', 'Surya Coal Mine',         'SUR-DEMO', 'OPEN_CAST',   23.4102, 82.4501, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000021', 'Pragati Underground Mine','PRG-DEMO', 'UNDERGROUND', 22.9800, 82.1200, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000021', 'Aditya Open Cast Mine',   'ADT-DEMO', 'OPEN_CAST',   23.0500, 82.2000, 'ACTIVE')
on conflict (id) do nothing;

-- ============ RBAC ============
insert into roles (id, key, name) values
  ('a0000000-0000-0000-0000-000000000040', 'SUPER_ADMIN', 'Super Admin'),
  ('a0000000-0000-0000-0000-000000000041', 'CORPORATE_ADMIN', 'Corporate Admin'),
  ('a0000000-0000-0000-0000-000000000042', 'MINE_MANAGER', 'Mine Manager'),
  ('a0000000-0000-0000-0000-000000000043', 'INSPECTOR', 'Inspector'),
  ('a0000000-0000-0000-0000-000000000044', 'CONTRACTOR', 'Contractor'),
  ('a0000000-0000-0000-0000-000000000045', 'REGULATOR', 'Regulator')
on conflict (id) do nothing;

insert into permissions (id, key, description) values
  ('a0000000-0000-0000-0000-000000000050', 'dashboard.view', 'View dashboards'),
  ('a0000000-0000-0000-0000-000000000051', 'mines.view', 'View mines'),
  ('a0000000-0000-0000-0000-000000000052', 'mines.manage', 'Manage mines'),
  ('a0000000-0000-0000-0000-000000000053', 'compliance.view', 'View compliance'),
  ('a0000000-0000-0000-0000-000000000054', 'compliance.manage', 'Manage compliance'),
  ('a0000000-0000-0000-0000-000000000055', 'inspections.view', 'View inspections'),
  ('a0000000-0000-0000-0000-000000000056', 'inspections.create', 'Create inspections'),
  ('a0000000-0000-0000-0000-000000000057', 'inspections.approve', 'Approve inspections'),
  ('a0000000-0000-0000-0000-000000000058', 'incidents.view', 'View incidents'),
  ('a0000000-0000-0000-0000-000000000059', 'incidents.create', 'Create incidents'),
  ('a0000000-0000-0000-0000-000000000060', 'contractors.view', 'View contractors'),
  ('a0000000-0000-0000-0000-000000000061', 'contractors.manage', 'Manage contractors'),
  ('a0000000-0000-0000-0000-000000000062', 'reports.view', 'View reports'),
  ('a0000000-0000-0000-0000-000000000063', 'reports.generate', 'Generate reports'),
  ('a0000000-0000-0000-0000-000000000064', 'documents.upload', 'Upload documents'),
  ('a0000000-0000-0000-0000-000000000065', 'users.manage', 'Manage users'),
  ('a0000000-0000-0000-0000-000000000066', 'audit.view', 'View audit logs'),
  ('a0000000-0000-0000-0000-000000000067', 'ai.view', 'View AI features')
on conflict (id) do nothing;

-- Role permissions mapping
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.key = 'SUPER_ADMIN'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'CORPORATE_ADMIN' and p.key in (
  'dashboard.view','mines.view','mines.manage','compliance.view','compliance.manage',
  'inspections.view','inspections.approve','incidents.view','incidents.create',
  'contractors.view','contractors.manage','reports.view','reports.generate',
  'documents.upload','users.manage','audit.view','ai.view')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'MINE_MANAGER' and p.key in (
  'dashboard.view','mines.view','mines.manage','compliance.view','compliance.manage',
  'inspections.view','inspections.approve','incidents.view','incidents.create',
  'contractors.view','contractors.manage','reports.view','reports.generate',
  'documents.upload','audit.view','ai.view')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'INSPECTOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','inspections.view','inspections.create',
  'incidents.view','incidents.create','reports.view','documents.upload','ai.view')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'CONTRACTOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','incidents.create','contractors.view',
  'reports.view','documents.upload')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'REGULATOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','inspections.view','incidents.view',
  'contractors.view','reports.view','ai.view')
on conflict do nothing;

-- ============ DEMO AUTH USERS ============
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values
  ('a0000000-0000-0000-0000-000000000100', 'admin.demo@sih26024.test', crypt('CoalGuard@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Super Admin"}'::jsonb, 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-000000000101', 'manager.shakti.demo@sih26024.test', crypt('CoalGuard@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Mine Manager"}'::jsonb, 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-000000000102', 'inspector.shakti.demo@sih26024.test', crypt('CoalGuard@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Inspector"}'::jsonb, 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-000000000103', 'contractor.alpha.demo@sih26024.test', crypt('CoalGuard@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Contractor"}'::jsonb, 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-000000000104', 'regulator.demo@sih26024.test', crypt('CoalGuard@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Regulator"}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  aud = excluded.aud,
  role = excluded.role;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  id, id, id, json_build_object('sub', id, 'email', email)::jsonb, 'email', now(), now(), now()
from auth.users
where email like '%@sih26024.test'
on conflict (provider, provider_id) do nothing;

-- ============ CONTRACTORS & PROFILES ============
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('a0000000-0000-0000-0000-000000000110', 'a0000000-0000-0000-0000-000000000030', 'Alpha Mining Services (Demo)', 'REG-DEMO-001', 'Demo Contact Alpha', 'contact.alpha.demo@sih26024.test', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000111', 'a0000000-0000-0000-0000-000000000030', 'Beta Logistics Pvt Ltd (Demo)', 'REG-DEMO-002', 'Demo Contact Beta', 'contact.beta.demo@sih26024.test', 'ACTIVE')
on conflict (id) do nothing;

insert into profiles (id, full_name, email, is_active) values
  ('a0000000-0000-0000-0000-000000000100', 'Demo Super Admin', 'admin.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000101', 'Demo Mine Manager (Shakti)', 'manager.shakti.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000102', 'Demo Inspector (Shakti)', 'inspector.shakti.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000104', 'Demo Regulator', 'regulator.demo@sih26024.test', true)
on conflict (id) do nothing;

insert into profiles (id, full_name, email, contractor_id, is_active) values
  ('a0000000-0000-0000-0000-000000000103', 'Demo Contractor User (Alpha)', 'contractor.alpha.demo@sih26024.test', 'a0000000-0000-0000-0000-000000000110', true)
on conflict (id) do nothing;

insert into user_roles (user_id, role_id, mine_id) values
  ('a0000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000040', null),
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000030'),
  ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000030'),
  ('a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000044', null),
  ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000030')
on conflict do nothing;

insert into contractor_workers (id, contractor_id, full_name, role_title) values
  ('a0000000-0000-0000-0000-000000000120', 'a0000000-0000-0000-0000-000000000110', 'Demo Worker One', 'Machine Operator'),
  ('a0000000-0000-0000-0000-000000000121', 'a0000000-0000-0000-0000-000000000110', 'Demo Worker Two', 'Safety Officer')
on conflict (id) do nothing;

-- ============ COMPLIANCE ============
insert into compliance_categories (id, name) values
  ('a0000000-0000-0000-0000-000000000200', 'Environmental (Demo)'),
  ('a0000000-0000-0000-0000-000000000201', 'Safety (Demo)')
on conflict (id) do nothing;

insert into compliance_requirements (id, mine_id, category_id, title, description, regulatory_authority, frequency, priority, is_demo_content) values
  ('a0000000-0000-0000-0000-000000000210', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000201', 'Weekly safety walkthrough (Demo)', 'Statutory safety walkthrough required under Coal Mines Regulations 2017.', 'Directorate General of Mines Safety (DGMS)', 'WEEKLY', 'HIGH', true),
  ('a0000000-0000-0000-0000-000000000211', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000200', 'Monthly dust monitoring report (Demo)', 'Particulate matter and respirable dust monitoring return.', 'State Pollution Control Board (SPCB)', 'MONTHLY', 'MEDIUM', true)
on conflict (id) do nothing;

insert into compliance_records (id, requirement_id, mine_id, due_date, completed_date, status, notes) values
  ('a0000000-0000-0000-0000-000000000220', 'a0000000-0000-0000-0000-000000000210', 'a0000000-0000-0000-0000-000000000030', '2026-08-01', '2026-07-30', 'COMPLIANT', 'Walkthrough completed and approved by Safety Manager.'),
  ('a0000000-0000-0000-0000-000000000221', 'a0000000-0000-0000-0000-000000000211', 'a0000000-0000-0000-0000-000000000030', '2026-07-01', null, 'OVERDUE', 'Awaiting laboratory emission analysis report.')
on conflict (id) do nothing;

-- ============ INSPECTIONS & OBSERVATIONS ============
insert into inspections (id, mine_id, inspector_id, inspection_type, scheduled_date, actual_date, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000230', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000102', 'ROUTINE', '2026-08-05', '2026-08-05', 23.2601, 82.3620, 'APPROVED')
on conflict (id) do nothing;

insert into inspection_observations (id, inspection_id, description, severity, latitude, longitude) values
  ('a0000000-0000-0000-0000-000000000240', 'a0000000-0000-0000-0000-000000000230', 'Critical safety observation: Guard rail missing near conveyor belt 3 drive head.', 'CRITICAL', 23.2602, 82.3621)
on conflict (id) do nothing;

insert into corrective_actions (id, source_type, source_id, issue, responsible_user_id, deadline, priority, status) values
  ('a0000000-0000-0000-0000-000000000250', 'INSPECTION', 'a0000000-0000-0000-0000-000000000230', 'Erect reinforced protective guard rail at conveyor drive head.', 'a0000000-0000-0000-0000-000000000101', '2026-08-20', 'HIGH', 'OPEN')
on conflict (id) do nothing;

-- ============ INCIDENTS ============
insert into incident_types (id, name) values ('a0000000-0000-0000-0000-000000000260', 'Equipment Malfunction (Demo)')
on conflict (id) do nothing;

insert into incidents (id, mine_id, incident_type_id, occurred_at, description, severity, reported_by, status) values
  ('a0000000-0000-0000-0000-000000000270', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000260', '2026-08-03T09:15:00Z', 'Conveyor motor thermal trip tripped circuit breaker due to dust accumulation.', 'MEDIUM', 'a0000000-0000-0000-0000-000000000102', 'RESOLVED')
on conflict (id) do nothing;

-- ============ ENVIRONMENTAL & OPERATIONAL ============
insert into environmental_monitoring_points (id, mine_id, name, latitude, longitude, parameter_type) values
  ('a0000000-0000-0000-0000-000000000280', 'a0000000-0000-0000-0000-000000000030', 'Shakti North Pit Ambient Station', 23.2605, 82.3625, 'AIR_QUALITY')
on conflict (id) do nothing;

insert into environmental_readings (id, monitoring_point_id, parameter_type, value, unit, threshold_value, status, recorded_by, is_demo_content) values
  ('a0000000-0000-0000-0000-000000000290', 'a0000000-0000-0000-0000-000000000280', 'AIR_QUALITY', 82, 'AQI', 100, 'NORMAL', 'a0000000-0000-0000-0000-000000000102', true)
on conflict (id) do nothing;

insert into production_reports (id, mine_id, period_start, period_end, target_quantity, actual_quantity, unit, status, submitted_by) values
  ('a0000000-0000-0000-0000-000000000300', 'a0000000-0000-0000-0000-000000000030', '2026-07-01', '2026-07-31', 50000, 47500, 'tonnes', 'SUBMITTED', 'a0000000-0000-0000-0000-000000000101')
on conflict (id) do nothing;

insert into worker_attendance (id, worker_id, mine_id, attendance_date, check_in, status, source, recorded_by) values
  ('a0000000-0000-0000-0000-000000000310', 'a0000000-0000-0000-0000-000000000120', 'a0000000-0000-0000-0000-000000000030', '2026-08-05', '2026-08-05T06:00:00Z', 'PRESENT', 'MANUAL', 'a0000000-0000-0000-0000-000000000101')
on conflict (id) do nothing;

insert into grievances (id, mine_id, submitted_by, category, title, description, priority, status, is_confidential) values
  ('a0000000-0000-0000-0000-000000000320', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000103', 'Facilities', 'Drinking water access requirement at Sector B Haul Road', 'Workers at transfer point report drinking water replenishment delay.', 'MEDIUM', 'OPEN', true)
on conflict (id) do nothing;

insert into notifications (id, user_id, title, body, type, related_entity_type, related_entity_id) values
  ('a0000000-0000-0000-0000-000000000330', 'a0000000-0000-0000-0000-000000000101', 'Compliance overdue warning', 'Monthly dust monitoring report deadline has passed.', 'compliance.overdue', 'compliance_record', 'a0000000-0000-0000-0000-000000000221')
on conflict (id) do nothing;

-- ============ STATUTORY DOCUMENTS ============
insert into documents (
  id, mine_id, owner_type, owner_id, storage_path, file_name, mime_type,
  uploaded_by, processing_status, extracted_text
) values
  (
    'a0000000-0000-0000-0000-000000000400',
    'a0000000-0000-0000-0000-000000000030',
    'COMPLIANCE',
    'a0000000-0000-0000-0000-000000000210',
    'mine-documents/shakti/dgms-clearance-2026.pdf',
    'DGMS_Clearance_Shakti_2026.pdf',
    'application/pdf',
    'a0000000-0000-0000-0000-000000000101',
    'PROCESSED',
    'MINISTRY OF COAL & MINES - DIRECTORATE GENERAL OF MINES SAFETY\nPERMIT: DGMS/CZ/SHK/2026/0881\nCLEARANCE: Valid for Open Cast Operations up to 5MTPA capacity.\nEXPIRY DATE: 2026-11-30\nCONDITIONS: Strict adherence to CMR 2017 Chapter IX Ventilation & Dust controls.'
  ),
  (
    'a0000000-0000-0000-0000-000000000401',
    'a0000000-0000-0000-0000-000000000030',
    'ENVIRONMENTAL',
    'a0000000-0000-0000-0000-000000000211',
    'mine-documents/shakti/moefcc-clearance-2026.pdf',
    'MOEFCC_Environmental_Clearance_2026.pdf',
    'application/pdf',
    'a0000000-0000-0000-0000-000000000101',
    'PROCESSED',
    'MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE\nREFERENCE: J-11015/284/2021-IA.II(M)\nSUBJECT: Environmental Clearance for Shakti OCP Exp.\nEXPIRY DATE: 2026-09-15\nSTATUS: Immediate Renewal Required.'
  )
on conflict (id) do nothing;

-- ============ CONNECTED AI RECORDS ============
insert into risk_scores (
  id, mine_id, entity_type, entity_id, score, factors, model_version
) values (
  'a0000000-0000-0000-0000-000000000500',
  'a0000000-0000-0000-0000-000000000030',
  'MINE',
  'a0000000-0000-0000-0000-000000000030',
  68,
  '[
    {"category": "COMPLIANCE", "weight": 25, "description": "Overdue dust monitoring statutory return"},
    {"category": "SAFETY", "weight": 28, "description": "CRITICAL inspection finding: missing conveyor guard rail"},
    {"category": "INCIDENTS", "weight": 15, "description": "Conveyor thermal trip equipment malfunction incident"}
  ]'::jsonb,
  'gemini-2.5-flash'
)
on conflict (id) do nothing;

insert into ai_recommendations (
  id, mine_id, entity_type, entity_id, recommendation, priority, status
) values
  ('a0000000-0000-0000-0000-000000000510', 'a0000000-0000-0000-0000-000000000030', 'MINE', 'a0000000-0000-0000-0000-000000000030', 'Expedite fabrication of protective steel guard rail at conveyor drive head to mitigate fall/crush risk.', 'HIGH', 'NEW'),
  ('a0000000-0000-0000-0000-000000000511', 'a0000000-0000-0000-0000-000000000030', 'MINE', 'a0000000-0000-0000-0000-000000000030', 'Complete ambient dust monitoring air sample testing and file regulatory return with SPCB.', 'MEDIUM', 'NEW')
on conflict (id) do nothing;

insert into anomaly_events (
  id, mine_id, entity_type, entity_id, description, confidence, status
) values (
  'a0000000-0000-0000-0000-000000000520',
  'a0000000-0000-0000-0000-000000000030',
  'MINE',
  'a0000000-0000-0000-0000-000000000030',
  'Statistical clustering: Critical safety observation coupled with overdue air quality monitoring return.',
  0.92,
  'NEW'
)
on conflict (id) do nothing;

insert into audit_logs (
  id, actor_id, role_key, action, entity_type, entity_id, new_data
) values (
  'a0000000-0000-0000-0000-000000000530',
  'a0000000-0000-0000-0000-000000000100',
  'SUPER_ADMIN',
  'SYSTEM_INITIALIZATION',
  'GOVERNANCE_SYSTEM',
  'a0000000-0000-0000-0000-000000000001',
  '{"status":"ONLINE","seeded_by":"Live Supabase Integration Engineer","project":"CoalGuard AI"}'::jsonb
)
on conflict (id) do nothing;
