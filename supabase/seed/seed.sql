-- seed.sql — FICTIONAL DEMO DATA ONLY. No real personal information, no verified regulatory
-- data. Every mine, person, and reading below is invented for the SIH26024 demo.
-- Run against a fresh Supabase project AFTER migrations (0001-0011) have been applied.
-- Local validation: this file was applied to a real local Postgres instance in this session
-- (see HANDOFF.md "Seed Data — Tested" for the exact command and row-count proof).

-- ============ ORG HIERARCHY ============
insert into organizations (id, name, code) values
  ('a0000000-0000-0000-0000-000000000001', 'Coal India Limited (Demo)', 'CIL-DEMO');

insert into subsidiaries (id, organization_id, name, code) values
  ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'South Eastern Coalfields (Demo)', 'SECL-DEMO');

insert into regions (id, subsidiary_id, name, code) values
  ('a0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000010', 'Region North (Demo)', 'RN-DEMO'),
  ('a0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000010', 'Region South (Demo)', 'RS-DEMO');

-- 4 fictional mines, as required
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000020', 'Shakti Open Cast Mine',   'SHK-DEMO', 'OPEN_CAST',   23.2599, 82.3616, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000020', 'Surya Coal Mine',         'SUR-DEMO', 'OPEN_CAST',   23.4102, 82.4501, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000021', 'Pragati Underground Mine','PRG-DEMO', 'UNDERGROUND', 22.9800, 82.1200, 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000021', 'Aditya Open Cast Mine',   'ADT-DEMO', 'OPEN_CAST',   23.0500, 82.2000, 'ACTIVE');

-- ============ RBAC ============
insert into roles (id, key, name) values
  ('a0000000-0000-0000-0000-000000000040', 'SUPER_ADMIN', 'Super Admin'),
  ('a0000000-0000-0000-0000-000000000041', 'CORPORATE_ADMIN', 'Corporate Admin'),
  ('a0000000-0000-0000-0000-000000000042', 'MINE_MANAGER', 'Mine Manager'),
  ('a0000000-0000-0000-0000-000000000043', 'INSPECTOR', 'Inspector'),
  ('a0000000-0000-0000-0000-000000000044', 'CONTRACTOR', 'Contractor'),
  ('a0000000-0000-0000-0000-000000000045', 'REGULATOR', 'Regulator');

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
  ('a0000000-0000-0000-0000-000000000067', 'ai.view', 'View AI features');

-- role_permissions per ROLES.md matrix (generated to match packages/config/src/index.ts exactly)
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.key = 'SUPER_ADMIN';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'CORPORATE_ADMIN' and p.key in (
  'dashboard.view','mines.view','mines.manage','compliance.view','compliance.manage',
  'inspections.view','inspections.approve','incidents.view','incidents.create',
  'contractors.view','contractors.manage','reports.view','reports.generate',
  'documents.upload','users.manage','audit.view','ai.view');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'MINE_MANAGER' and p.key in (
  'dashboard.view','mines.view','mines.manage','compliance.view','compliance.manage',
  'inspections.view','inspections.approve','incidents.view','incidents.create',
  'contractors.view','contractors.manage','reports.view','reports.generate',
  'documents.upload','audit.view','ai.view');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'INSPECTOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','inspections.view','inspections.create',
  'incidents.view','incidents.create','reports.view','documents.upload','ai.view');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'CONTRACTOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','incidents.create','contractors.view',
  'reports.view','documents.upload');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.key = 'REGULATOR' and p.key in (
  'dashboard.view','mines.view','compliance.view','inspections.view','incidents.view',
  'contractors.view','reports.view','ai.view');

-- ============ DEMO USERS ============
-- NOTE: these auth.users rows only exist because Supabase's auth.users table is what
-- profiles/user_roles reference. In a real deployment these come from Supabase Auth signup,
-- not a direct insert. Fictional emails/names only.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000100', 'admin.demo@sih26024.test'),
  ('a0000000-0000-0000-0000-000000000101', 'manager.shakti.demo@sih26024.test'),
  ('a0000000-0000-0000-0000-000000000102', 'inspector.shakti.demo@sih26024.test'),
  ('a0000000-0000-0000-0000-000000000103', 'contractor.alpha.demo@sih26024.test'),
  ('a0000000-0000-0000-0000-000000000104', 'regulator.demo@sih26024.test')
on conflict (id) do nothing;

insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('a0000000-0000-0000-0000-000000000110', 'a0000000-0000-0000-0000-000000000030', 'Alpha Mining Services (Demo)', 'REG-DEMO-001', 'Demo Contact Alpha', 'contact.alpha.demo@sih26024.test', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000111', 'a0000000-0000-0000-0000-000000000030', 'Beta Logistics Pvt Ltd (Demo)', 'REG-DEMO-002', 'Demo Contact Beta', 'contact.beta.demo@sih26024.test', 'ACTIVE');

insert into profiles (id, full_name, email, is_active) values
  ('a0000000-0000-0000-0000-000000000100', 'Demo Super Admin', 'admin.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000101', 'Demo Mine Manager (Shakti)', 'manager.shakti.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000102', 'Demo Inspector (Shakti)', 'inspector.shakti.demo@sih26024.test', true),
  ('a0000000-0000-0000-0000-000000000104', 'Demo Regulator', 'regulator.demo@sih26024.test', true);
insert into profiles (id, full_name, email, contractor_id, is_active) values
  ('a0000000-0000-0000-0000-000000000103', 'Demo Contractor User (Alpha)', 'contractor.alpha.demo@sih26024.test', 'a0000000-0000-0000-0000-000000000110', true);

insert into user_roles (user_id, role_id, mine_id) values
  ('a0000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000040', null),
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000030'),
  ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000030'),
  ('a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000044', null),
  ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000030');

insert into contractor_workers (id, contractor_id, full_name, role_title) values
  ('a0000000-0000-0000-0000-000000000120', 'a0000000-0000-0000-0000-000000000110', 'Demo Worker One', 'Machine Operator'),
  ('a0000000-0000-0000-0000-000000000121', 'a0000000-0000-0000-0000-000000000110', 'Demo Worker Two', 'Safety Officer');

-- ============ COMPLIANCE (demo/configurable, not verified regulatory data) ============
insert into compliance_categories (id, name) values
  ('a0000000-0000-0000-0000-000000000200', 'Environmental (Demo)'),
  ('a0000000-0000-0000-0000-000000000201', 'Safety (Demo)');

insert into compliance_requirements (id, mine_id, category_id, title, description, regulatory_authority, frequency, priority, is_demo_content) values
  ('a0000000-0000-0000-0000-000000000210', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000201', 'Weekly safety walkthrough (Demo)', 'Fictional demo requirement, not sourced from an authoritative regulation.', 'Demo Regulatory Body', 'WEEKLY', 'HIGH', true),
  ('a0000000-0000-0000-0000-000000000211', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000200', 'Monthly dust monitoring report (Demo)', 'Fictional demo requirement.', 'Demo Regulatory Body', 'MONTHLY', 'MEDIUM', true);

insert into compliance_records (id, requirement_id, mine_id, due_date, completed_date, status, notes) values
  ('a0000000-0000-0000-0000-000000000220', 'a0000000-0000-0000-0000-000000000210', 'a0000000-0000-0000-0000-000000000030', '2026-08-01', '2026-07-30', 'COMPLIANT', 'Demo record — walkthrough completed.'),
  ('a0000000-0000-0000-0000-000000000221', 'a0000000-0000-0000-0000-000000000211', 'a0000000-0000-0000-0000-000000000030', '2026-07-01', null, 'OVERDUE', 'Demo record — report not yet filed.');

-- ============ INSPECTIONS / OBSERVATIONS / CORRECTIVE ACTIONS ============
insert into inspections (id, mine_id, inspector_id, inspection_type, scheduled_date, actual_date, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000230', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000102', 'ROUTINE', '2026-08-05', '2026-08-05', 23.2601, 82.3620, 'APPROVED');

insert into inspection_observations (id, inspection_id, description, severity, latitude, longitude) values
  ('a0000000-0000-0000-0000-000000000240', 'a0000000-0000-0000-0000-000000000230', 'Demo observation: guard rail missing a section near conveyor belt 3.', 'HIGH', 23.2602, 82.3621);

insert into corrective_actions (id, source_type, source_id, issue, responsible_user_id, deadline, priority, status) values
  ('a0000000-0000-0000-0000-000000000250', 'INSPECTION', 'a0000000-0000-0000-0000-000000000230', 'Demo corrective action: replace missing guard rail section.', 'a0000000-0000-0000-0000-000000000101', '2026-08-20', 'HIGH', 'OPEN');

-- ============ INCIDENTS ============
insert into incident_types (id, name) values ('a0000000-0000-0000-0000-000000000260', 'Equipment Malfunction (Demo)');
insert into incidents (id, mine_id, incident_type_id, occurred_at, description, severity, reported_by, status) values
  ('a0000000-0000-0000-0000-000000000270', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000260', '2026-08-03T09:15:00Z', 'Demo incident: conveyor motor overheated and shut down automatically.', 'MEDIUM', 'a0000000-0000-0000-0000-000000000102', 'RESOLVED');

-- ============ ENVIRONMENTAL / PRODUCTION / ATTENDANCE / GRIEVANCES ============
insert into environmental_monitoring_points (id, mine_id, name, latitude, longitude, parameter_type) values
  ('a0000000-0000-0000-0000-000000000280', 'a0000000-0000-0000-0000-000000000030', 'Demo Air Quality Station 1', 23.2605, 82.3625, 'AIR_QUALITY');
insert into environmental_readings (id, monitoring_point_id, parameter_type, value, unit, threshold_value, status, recorded_by, is_demo_content) values
  ('a0000000-0000-0000-0000-000000000290', 'a0000000-0000-0000-0000-000000000280', 'AIR_QUALITY', 82, 'AQI', 100, 'NORMAL', 'a0000000-0000-0000-0000-000000000102', true);

insert into production_reports (id, mine_id, period_start, period_end, target_quantity, actual_quantity, unit, status, submitted_by) values
  ('a0000000-0000-0000-0000-000000000300', 'a0000000-0000-0000-0000-000000000030', '2026-07-01', '2026-07-31', 50000, 47500, 'tonnes', 'SUBMITTED', 'a0000000-0000-0000-0000-000000000101');

insert into worker_attendance (id, worker_id, mine_id, attendance_date, check_in, status, source, recorded_by) values
  ('a0000000-0000-0000-0000-000000000310', 'a0000000-0000-0000-0000-000000000120', 'a0000000-0000-0000-0000-000000000030', '2026-08-05', '2026-08-05T06:00:00Z', 'PRESENT', 'MANUAL', 'a0000000-0000-0000-0000-000000000101');

insert into grievances (id, mine_id, submitted_by, category, title, description, priority, status, is_confidential) values
  ('a0000000-0000-0000-0000-000000000320', 'a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000103', 'Facilities', 'Demo grievance: drinking water access at site B', 'Fictional demo grievance content.', 'MEDIUM', 'OPEN', true);

-- ============ NOTIFICATIONS ============
insert into notifications (id, user_id, title, body, type, related_entity_type, related_entity_id) values
  ('a0000000-0000-0000-0000-000000000330', 'a0000000-0000-0000-0000-000000000101', 'Compliance overdue (Demo)', 'Monthly dust monitoring report is overdue.', 'compliance.overdue', 'compliance_record', 'a0000000-0000-0000-0000-000000000221');

-- ============ SUMMARY (run manually to eyeball row counts after seeding) ============
-- select 'mines', count(*) from mines
-- union all select 'compliance_records', count(*) from compliance_records
-- union all select 'inspections', count(*) from inspections
-- union all select 'incidents', count(*) from incidents
-- union all select 'contractors', count(*) from contractors;
