const fs = require('fs');
const path = require('path');

const REGION_NORTH = 'a0000000-0000-0000-0000-000000000020';
const REGION_SOUTH = 'a0000000-0000-0000-0000-000000000021';
const ADMIN_ID = 'a0000000-0000-0000-0000-000000000100';
const MANAGER_ID = 'a0000000-0000-0000-0000-000000000101';
const INSPECTOR_ID = 'a0000000-0000-0000-0000-000000000102';
const CONTRACTOR_USER_ID = 'a0000000-0000-0000-0000-000000000103';

const MINES = [
  { id: 'a0000000-0000-0000-0000-000000000030', region_id: REGION_NORTH, name: 'Shakti Open Cast Mine',   code: 'SHK-DEMO', mine_type: 'OPEN_CAST',   latitude: 22.3595, longitude: 82.7501, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000031', region_id: REGION_NORTH, name: 'Surya Coal Mine',         code: 'SUR-DEMO', mine_type: 'OPEN_CAST',   latitude: 23.4102, longitude: 82.4501, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000032', region_id: REGION_SOUTH, name: 'Pragati Underground Mine',code: 'PRG-DEMO', mine_type: 'UNDERGROUND', latitude: 22.9800, longitude: 82.1200, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000033', region_id: REGION_SOUTH, name: 'Aditya Open Cast Mine',   code: 'ADT-DEMO', mine_type: 'OPEN_CAST',   latitude: 23.0500, longitude: 82.2000, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000034', region_id: REGION_NORTH, name: 'Vindhya Coal Mine',       code: 'VND-DEMO', mine_type: 'OPEN_CAST',   latitude: 24.1997, longitude: 82.6644, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000035', region_id: REGION_NORTH, name: 'Eastern Ridge Mine',      code: 'ERC-DEMO', mine_type: 'MIXED',       latitude: 23.6248, longitude: 87.1264, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000036', region_id: REGION_NORTH, name: 'Central Basin Open Cast', code: 'CBN-DEMO', mine_type: 'OPEN_CAST',   latitude: 23.7957, longitude: 85.9597, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000037', region_id: REGION_SOUTH, name: 'Satpura Coal Mine',       code: 'STP-DEMO', mine_type: 'UNDERGROUND', latitude: 22.1852, longitude: 78.7412, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000038', region_id: REGION_SOUTH, name: 'Narmada Valley Mine',     code: 'NVB-DEMO', mine_type: 'UNDERGROUND', latitude: 21.9042, longitude: 77.9015, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-000000000039', region_id: REGION_SOUTH, name: 'Deccan Coal Project',     code: 'DCP-DEMO', mine_type: 'OPEN_CAST',   latitude: 19.9615, longitude: 79.2961, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-00000000003a', region_id: REGION_NORTH, name: 'Korba Ridge Mine',        code: 'KRB-DEMO', mine_type: 'OPEN_CAST',   latitude: 22.4110, longitude: 82.6820, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-00000000003b', region_id: REGION_NORTH, name: 'Damodar Open Cast Mine',  code: 'DMR-DEMO', mine_type: 'OPEN_CAST',   latitude: 23.7957, longitude: 86.4304, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-00000000003c', region_id: REGION_SOUTH, name: 'Mahanadi Coal Block',     code: 'MHD-DEMO', mine_type: 'OPEN_CAST',   latitude: 21.8554, longitude: 84.0062, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-00000000003d', region_id: REGION_SOUTH, name: 'Godavari Basin Mine',     code: 'GDB-DEMO', mine_type: 'UNDERGROUND', latitude: 17.5501, longitude: 80.6172, status: 'ACTIVE' },
  { id: 'a0000000-0000-0000-0000-00000000003e', region_id: REGION_NORTH, name: 'Kalinga Open Cast Mine',  code: 'KLG-DEMO', mine_type: 'OPEN_CAST',   latitude: 20.9509, longitude: 85.2166, status: 'ACTIVE' }
];

const CONTRACTORS = [
  { id: 'b0000000-0000-0000-0000-000000000001', mine_id: MINES[0].id, company_name: 'Alpha Mining Services',   registration_no: 'REG-DEMO-001', contact_name: 'Ramesh Patel',  contact_email: 'ramesh.alpha@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000002', mine_id: MINES[0].id, company_name: 'Beta Heavy Haulage',     registration_no: 'REG-DEMO-002', contact_name: 'Sunil Verma',   contact_email: 'sunil.beta@demo.test',    status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000003', mine_id: MINES[4].id, company_name: 'Vindhya Earthmovers',    registration_no: 'REG-DEMO-003', contact_name: 'Amit Sharma',   contact_email: 'amit.vindhya@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000004', mine_id: MINES[5].id, company_name: 'Eastern Blasting Corp',  registration_no: 'REG-DEMO-004', contact_name: 'Deepak Roy',    contact_email: 'deepak.east@demo.test',   status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000005', mine_id: MINES[9].id, company_name: 'Deccan Logistics Ltd',   registration_no: 'REG-DEMO-005', contact_name: 'Vijay Reddy',   contact_email: 'vijay.deccan@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000006', mine_id: MINES[14].id,company_name: 'Kalinga Safety Logistics',registration_no: 'REG-DEMO-006', contact_name: 'Sanjay Mishra', contact_email: 'sanjay.kal@demo.test',    status: 'ACTIVE' }
];

let sql = `-- CoalGuard AI Comprehensive Idempotent Seed File
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
`;

for (const m of MINES) {
  sql += `insert into mines (id, region_id, name, code, mine_type, latitude, longitude, status) values
  ('${m.id}', '${m.region_id}', '${m.name.replace(/'/g, "''")}', '${m.code}', '${m.mine_type}', ${m.latitude}, ${m.longitude}, '${m.status}')
on conflict (id) do nothing;\n`;
}

sql += `\n-- ============ 6+ CONTRACTORS ============
`;
for (const c of CONTRACTORS) {
  sql += `insert into contractors (id, mine_id, company_name, registration_no, contact_name, contact_email, status) values
  ('${c.id}', '${c.mine_id}', '${c.company_name}', '${c.registration_no}', '${c.contact_name}', '${c.contact_email}', '${c.status}')
on conflict (id) do nothing;\n`;
}

const seedPath = path.join(__dirname, '..', 'supabase', 'seed', 'seed.sql');
fs.writeFileSync(seedPath, sql, 'utf8');

const liveSeedPath = path.join(__dirname, '..', 'scripts', 'live_seed.sql');
fs.writeFileSync(liveSeedPath, sql, 'utf8');

console.log('Successfully generated supabase/seed/seed.sql and scripts/live_seed.sql');
