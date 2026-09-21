-- CoalGuard AI Comprehensive Idempotent Seed File
-- Safer Mines — Smarter Governance
-- All entities strictly marked as demonstration data (is_demo = true)

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

-- ============ 12+ DEMO MINES ============
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000020', 'Shakti Open Cast Mine', 'SHK-DEMO', 'OPEN_CAST', 22.3595, 82.7501, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000020', 'Surya Coal Mine', 'SUR-DEMO', 'OPEN_CAST', 23.4102, 82.4501, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000021', 'Pragati Underground Mine', 'PRG-DEMO', 'UNDERGROUND', 22.98, 82.12, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000021', 'Aditya Open Cast Mine', 'ADT-DEMO', 'OPEN_CAST', 23.05, 82.2, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000020', 'Vindhya Coal Mine', 'VND-DEMO', 'OPEN_CAST', 24.1997, 82.6644, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000020', 'Eastern Ridge Mine', 'ERC-DEMO', 'MIXED', 23.6248, 87.1264, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000020', 'Central Basin Open Cast', 'CBN-DEMO', 'OPEN_CAST', 23.7957, 85.9597, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000021', 'Satpura Coal Mine', 'STP-DEMO', 'UNDERGROUND', 22.1852, 78.7412, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000021', 'Narmada Valley Mine', 'NVB-DEMO', 'UNDERGROUND', 21.9042, 77.9015, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000021', 'Deccan Coal Project', 'DCP-DEMO', 'OPEN_CAST', 19.9615, 79.2961, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-00000000003a', 'a0000000-0000-0000-0000-000000000020', 'Korba Ridge Mine', 'KRB-DEMO', 'OPEN_CAST', 22.411, 82.682, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-00000000003b', 'a0000000-0000-0000-0000-000000000020', 'Damodar Open Cast Mine', 'DMR-DEMO', 'OPEN_CAST', 23.7957, 86.4304, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-00000000003c', 'a0000000-0000-0000-0000-000000000021', 'Mahanadi Coal Block', 'MHD-DEMO', 'OPEN_CAST', 21.8554, 84.0062, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-00000000003d', 'a0000000-0000-0000-0000-000000000021', 'Godavari Basin Mine', 'GDB-DEMO', 'UNDERGROUND', 17.5501, 80.6172, 'ACTIVE')
on conflict (id) do nothing;
insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('a0000000-0000-0000-0000-00000000003e', 'a0000000-0000-0000-0000-000000000020', 'Kalinga Open Cast Mine', 'KLG-DEMO', 'OPEN_CAST', 20.9509, 85.2166, 'ACTIVE')
on conflict (id) do nothing;

-- ============ 6+ CONTRACTORS ============
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000030', 'Alpha Mining Services', 'REG-DEMO-001', 'Ramesh Patel', 'ramesh.alpha@demo.test', 'ACTIVE')
on conflict (id) do nothing;
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000030', 'Beta Heavy Haulage', 'REG-DEMO-002', 'Sunil Verma', 'sunil.beta@demo.test', 'ACTIVE')
on conflict (id) do nothing;
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000034', 'Vindhya Earthmovers', 'REG-DEMO-003', 'Amit Sharma', 'amit.vindhya@demo.test', 'ACTIVE')
on conflict (id) do nothing;
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000035', 'Eastern Blasting Corp', 'REG-DEMO-004', 'Deepak Roy', 'deepak.east@demo.test', 'ACTIVE')
on conflict (id) do nothing;
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000039', 'Deccan Logistics Ltd', 'REG-DEMO-005', 'Vijay Reddy', 'vijay.deccan@demo.test', 'ACTIVE')
on conflict (id) do nothing;
insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-00000000003e', 'Kalinga Safety Logistics', 'REG-DEMO-006', 'Sanjay Mishra', 'sanjay.kal@demo.test', 'ACTIVE')
on conflict (id) do nothing;
