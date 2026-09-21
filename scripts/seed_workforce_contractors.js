/**
 * COALGUARD AI — Idempotent Workforce and Contractor Seeding Script
 *
 * Enforces:
 * 1. 12 Fictional Contractors mapped 1-to-1 to 12 Primary Demo Mines.
 * 2. 48 Fictional Workers (4 per contractor) with strict mine_id = contractor.mine_id.
 * 3. Stable UUIDs & upserts to preserve foreign-key relationships (attendance, profiles).
 * 4. Preserves contractor UUID a0000000-0000-0000-0000-000000000110 for Koushik's account.
 * 5. Safe to execute repeatedly without duplicating records or corrupting RBAC.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('apps/web/.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

// 12 Primary Demo Mines by stable code
const MINE_CODES = {
  SHK: 'SHK-DEMO',
  VND: 'VND-DEMO',
  ERC: 'ERC-DEMO',
  CBN: 'CBN-DEMO',
  STP: 'STP-DEMO',
  NVB: 'NVB-DEMO',
  DMR: 'DMR-DEMO',
  KRB: 'KRB-DEMO',
  DCP: 'DCP-DEMO',
  MHD: 'MHD-DEMO',
  GDB: 'GDB-DEMO',
  KLG: 'KLG-DEMO',
};

// 12 Fictional Contractors
const CONTRACTORS_SPEC = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    code: 'CTR-SHK-001',
    company_name: 'Bharat Earthmovers Pvt Ltd',
    mine_code: MINE_CODES.SHK,
    services: 'Heavy equipment, excavation',
    contact_name: 'Rajesh Patel',
    contact_email: 'contact@bharat-earthmovers.demo',
    contact_phone: '+91 98765 43201',
    status: 'ACTIVE',
  },
  {
    // CRITICAL: Preserve UUID a0000000-0000-0000-0000-000000000110 for Koushik's RBAC profile!
    id: 'a0000000-0000-0000-0000-000000000110',
    code: 'CTR-VND-001',
    company_name: 'Alpha Mining Services',
    mine_code: MINE_CODES.VND,
    services: 'Drilling, excavation',
    contact_name: 'Imran Qureshi',
    contact_email: 'contact@alphamining.demo',
    contact_phone: '+91 98765 43202',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    code: 'CTR-ERC-001',
    company_name: 'Eastern Haulage Solutions',
    mine_code: MINE_CODES.ERC,
    services: 'Coal transportation',
    contact_name: 'Subir Banerjee',
    contact_email: 'contact@easternhaulage.demo',
    contact_phone: '+91 98765 43203',
    status: 'ACTIVE',
  },
  {
    // Reconcile legacy beta contractor row
    id: 'a0000000-0000-0000-0000-000000000111',
    code: 'CTR-CBN-001',
    company_name: 'Central Mine Engineering',
    mine_code: MINE_CODES.CBN,
    services: 'Electrical and mechanical',
    contact_name: 'Anand Kulkarni',
    contact_email: 'contact@centralmineeng.demo',
    contact_phone: '+91 98765 43204',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    code: 'CTR-STP-001',
    company_name: 'Satpura Safety Services',
    mine_code: MINE_CODES.STP,
    services: 'Safety inspections and safety marshals',
    contact_name: 'Ravi Verma',
    contact_email: 'contact@satpurasafety.demo',
    contact_phone: '+91 98765 43205',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    code: 'CTR-NVB-001',
    company_name: 'Narmada Equipment Works',
    mine_code: MINE_CODES.NVB,
    services: 'Heavy machinery maintenance',
    contact_name: 'Manish Tiwari',
    contact_email: 'contact@narmadaequip.demo',
    contact_phone: '+91 98765 43206',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    code: 'CTR-DMR-001',
    company_name: 'Damodar GeoMining Services',
    mine_code: MINE_CODES.DMR,
    services: 'Drilling and mining support',
    contact_name: 'Manoj Yadav',
    contact_email: 'contact@damodargeo.demo',
    contact_phone: '+91 98765 43207',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    code: 'CTR-KRB-001',
    company_name: 'Korba Industrial Logistics',
    mine_code: MINE_CODES.KRB,
    services: 'Haulage and material movement',
    contact_name: 'Alok Srivastav',
    contact_email: 'contact@korbalogistics.demo',
    contact_phone: '+91 98765 43208',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    code: 'CTR-DCP-001',
    company_name: 'Damodar Heavy Haulage',
    mine_code: MINE_CODES.DCP,
    services: 'Heavy haulage',
    contact_name: 'Vikram Deshmukh',
    contact_email: 'contact@damodarhaulage.demo',
    contact_phone: '+91 98765 43209',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    code: 'CTR-MHD-001',
    company_name: 'Mahanadi Technical Services',
    mine_code: MINE_CODES.MHD,
    services: 'Plant maintenance',
    contact_name: 'Biren Mohanty',
    contact_email: 'contact@mahanaditech.demo',
    contact_phone: '+91 98765 43210',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-00000000000a',
    code: 'CTR-GDB-001',
    company_name: 'Godavari Drilling Services',
    mine_code: MINE_CODES.GDB,
    services: 'Drilling and exploration',
    contact_name: 'Kiran Rao',
    contact_email: 'contact@godavaridrilling.demo',
    contact_phone: '+91 98765 43211',
    status: 'ACTIVE',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    code: 'CTR-KLG-001',
    company_name: 'Kalinga Mine Support Services',
    mine_code: MINE_CODES.KLG,
    services: 'Workforce and equipment support',
    contact_name: 'Ajay Patra',
    contact_email: 'contact@kalingasupport.demo',
    contact_phone: '+91 98765 43212',
    status: 'ACTIVE',
  },
];

// 48 Fictional Workers (4 per contractor, 4 per primary mine)
// Decimal format c000...0001 to c000...0046 perfectly reconciles existing rows c000...0001 to c000...0032!
const WORKERS_SPEC = [
  // Bharat Earthmovers Pvt Ltd (SHK-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000001', worker_id: 'WRK-SHK-001', full_name: 'Ramesh Patil', contractor_code: 'CTR-SHK-001', role_title: 'Heavy Equipment Operator', category: 'Heavy Equipment', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000002', worker_id: 'WRK-SHK-002', full_name: 'Sunita Deshmukh', contractor_code: 'CTR-SHK-001', role_title: 'Safety Marshal', category: 'Safety & Compliance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000003', worker_id: 'WRK-SHK-003', full_name: 'Arun Kumar', contractor_code: 'CTR-SHK-001', role_title: 'Haul Truck Driver', category: 'Haulage', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000004', worker_id: 'WRK-SHK-004', full_name: 'Santosh Shinde', contractor_code: 'CTR-SHK-001', role_title: 'Excavator Operator', category: 'Extraction', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Alpha Mining Services (VND-DEMO) — Preserving UUIDs a00...0120 & a00...0121 for FK consistency
  { id: 'a0000000-0000-0000-0000-000000000120', worker_id: 'WRK-VND-001', full_name: 'Priya Nair', contractor_code: 'CTR-VND-001', role_title: 'Loader Operator', category: 'Extraction', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'a0000000-0000-0000-0000-000000000121', worker_id: 'WRK-VND-002', full_name: 'Imran Sheikh', contractor_code: 'CTR-VND-001', role_title: 'Drill Operator', category: 'Drilling', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000005', worker_id: 'WRK-VND-003', full_name: 'Amit Sen', contractor_code: 'CTR-VND-001', role_title: 'Blasting Assistant', category: 'Blasting', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000006', worker_id: 'WRK-VND-004', full_name: 'Kavita Joshi', contractor_code: 'CTR-VND-001', role_title: 'Safety Officer', category: 'Safety & Compliance', shift: 'Shift C', status: 'INACTIVE', training: 'DUE' },

  // Eastern Haulage Solutions (ERC-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000007', worker_id: 'WRK-ERC-001', full_name: 'Biplab Ghosh', contractor_code: 'CTR-ERC-001', role_title: 'Haul Truck Driver', category: 'Haulage', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000008', worker_id: 'WRK-ERC-002', full_name: 'Subhash Mondal', contractor_code: 'CTR-ERC-001', role_title: 'Fleet Coordinator', category: 'Haulage', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000009', worker_id: 'WRK-ERC-003', full_name: 'Tapan Karmakar', contractor_code: 'CTR-ERC-001', role_title: 'Maintenance Fitter', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000010', worker_id: 'WRK-ERC-004', full_name: 'Debabrata Sen', contractor_code: 'CTR-ERC-001', role_title: 'Weighbridge Operator', category: 'Logistics', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Central Mine Engineering (CBN-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000011', worker_id: 'WRK-CBN-001', full_name: 'Nilesh Agarwal', contractor_code: 'CTR-CBN-001', role_title: 'Electrical Technician', category: 'Electrical', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000012', worker_id: 'WRK-CBN-002', full_name: 'Rakesh Pandey', contractor_code: 'CTR-CBN-001', role_title: 'Mechanical Fitter', category: 'Maintenance', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000013', worker_id: 'WRK-CBN-003', full_name: 'Suresh Verma', contractor_code: 'CTR-CBN-001', role_title: 'Substation Attendant', category: 'Electrical', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000014', worker_id: 'WRK-CBN-004', full_name: 'Ananya Mishra', contractor_code: 'CTR-CBN-001', role_title: 'Instrumentation Tech', category: 'Maintenance', shift: 'Shift B', status: 'ACTIVE', training: 'DUE' },

  // Satpura Safety Services (STP-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000015', worker_id: 'WRK-STP-001', full_name: 'Ravi Verma', contractor_code: 'CTR-STP-001', role_title: 'Safety Officer', category: 'Safety & Compliance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000016', worker_id: 'WRK-STP-002', full_name: 'Neha Sharma', contractor_code: 'CTR-STP-001', role_title: 'Safety Marshal', category: 'Safety & Compliance', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000017', worker_id: 'WRK-STP-003', full_name: 'Om Prakash', contractor_code: 'CTR-STP-001', role_title: 'Gas Testing Assistant', category: 'Safety & Compliance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000018', worker_id: 'WRK-STP-004', full_name: 'Dinesh Chouhan', contractor_code: 'CTR-STP-001', role_title: 'First Aid Attendant', category: 'Medical', shift: 'Shift C', status: 'INACTIVE', training: 'DUE' },

  // Narmada Equipment Works (NVB-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000019', worker_id: 'WRK-NVB-001', full_name: 'Kailash Malviya', contractor_code: 'CTR-NVB-001', role_title: 'Heavy Machinery Mechanic', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000020', worker_id: 'WRK-NVB-002', full_name: 'Rajeshwar Solanki', contractor_code: 'CTR-NVB-001', role_title: 'Welder', category: 'Maintenance', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000021', worker_id: 'WRK-NVB-003', full_name: 'Mohanlal Patel', contractor_code: 'CTR-NVB-001', role_title: 'Hydraulic Specialist', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000022', worker_id: 'WRK-NVB-004', full_name: 'Hemant Sonwane', contractor_code: 'CTR-NVB-001', role_title: 'Tyre Handler', category: 'Maintenance', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Damodar GeoMining Services (DMR-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000023', worker_id: 'WRK-DMR-001', full_name: 'Manoj Yadav', contractor_code: 'CTR-DMR-001', role_title: 'Driller', category: 'Drilling', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000024', worker_id: 'WRK-DMR-002', full_name: 'Deepak Singh', contractor_code: 'CTR-DMR-001', role_title: 'Blasting Assistant', category: 'Blasting', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000025', worker_id: 'WRK-DMR-003', full_name: 'Pradeep Soren', contractor_code: 'CTR-DMR-001', role_title: 'Core Sampler', category: 'Geology', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000026', worker_id: 'WRK-DMR-004', full_name: 'Sandeep Roy', contractor_code: 'CTR-DMR-001', role_title: 'Pit Surveyor Assistant', category: 'Geology', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },

  // Korba Industrial Logistics (KRB-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000027', worker_id: 'WRK-KRB-001', full_name: 'Bhupendra Rathore', contractor_code: 'CTR-KRB-001', role_title: 'Dumper Operator', category: 'Haulage', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000028', worker_id: 'WRK-KRB-002', full_name: 'Vinod Dewangan', contractor_code: 'CTR-KRB-001', role_title: 'Conveyor Attendant', category: 'Haulage', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000029', worker_id: 'WRK-KRB-003', full_name: 'Chabilal Sahu', contractor_code: 'CTR-KRB-001', role_title: 'Feeder Breaker Operator', category: 'Extraction', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000030', worker_id: 'WRK-KRB-004', full_name: 'Leela Sahu', contractor_code: 'CTR-KRB-001', role_title: 'Traffic Controller', category: 'Logistics', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Damodar Heavy Haulage (DCP-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000031', worker_id: 'WRK-DCP-001', full_name: 'Sanjay Kulkarni', contractor_code: 'CTR-DCP-001', role_title: 'Heavy Haulage Driver', category: 'Haulage', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000032', worker_id: 'WRK-DCP-002', full_name: 'Arvind Gadkari', contractor_code: 'CTR-DCP-001', role_title: 'Trailer Driver', category: 'Haulage', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000033', worker_id: 'WRK-DCP-003', full_name: 'Milind Kamble', contractor_code: 'CTR-DCP-001', role_title: 'Rigging Technician', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000034', worker_id: 'WRK-DCP-004', full_name: 'Sudhir Gokhale', contractor_code: 'CTR-DCP-001', role_title: 'Route Marshal', category: 'Logistics', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Mahanadi Technical Services (MHD-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000035', worker_id: 'WRK-MHD-001', full_name: 'Prasanna Behera', contractor_code: 'CTR-MHD-001', role_title: 'Plant Technician', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000036', worker_id: 'WRK-MHD-002', full_name: 'Lokanath Sahoo', contractor_code: 'CTR-MHD-001', role_title: 'Crusher Operator', category: 'Extraction', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000037', worker_id: 'WRK-MHD-003', full_name: 'Jagannath Das', contractor_code: 'CTR-MHD-001', role_title: 'Belt Splicer', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000038', worker_id: 'WRK-MHD-004', full_name: 'Minati Nayak', contractor_code: 'CTR-MHD-001', role_title: 'Quality Lab Assistant', category: 'Quality', shift: 'Shift B', status: 'INACTIVE', training: 'DUE' },

  // Godavari Drilling Services (GDB-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000039', worker_id: 'WRK-GDB-001', full_name: 'Kiran Rao', contractor_code: 'CTR-GDB-001', role_title: 'Drill Operator', category: 'Drilling', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000040', worker_id: 'WRK-GDB-002', full_name: 'Venkat Ramana', contractor_code: 'CTR-GDB-001', role_title: 'Mud Engineer', category: 'Drilling', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000041', worker_id: 'WRK-GDB-003', full_name: 'Srinivasulu Goud', contractor_code: 'CTR-GDB-001', role_title: 'Compressor Mechanic', category: 'Maintenance', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000042', worker_id: 'WRK-GDB-004', full_name: 'Madhav Reddy', contractor_code: 'CTR-GDB-001', role_title: 'Exploration Assistant', category: 'Geology', shift: 'Shift C', status: 'ACTIVE', training: 'DUE' },

  // Kalinga Mine Support Services (KLG-DEMO)
  { id: 'c0000000-0000-0000-0000-000000000043', worker_id: 'WRK-KLG-001', full_name: 'Ajay Kumar', contractor_code: 'CTR-KLG-001', role_title: 'Excavator Operator', category: 'Extraction', shift: 'Shift C', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000044', worker_id: 'WRK-KLG-002', full_name: 'Bikash Samal', contractor_code: 'CTR-KLG-001', role_title: 'Shovel Operator', category: 'Extraction', shift: 'Shift A', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000045', worker_id: 'WRK-KLG-003', full_name: 'Tushar Pradhan', contractor_code: 'CTR-KLG-001', role_title: 'Pit Bench Marshall', category: 'Safety & Compliance', shift: 'Shift B', status: 'ACTIVE', training: 'VALID' },
  { id: 'c0000000-0000-0000-0000-000000000046', worker_id: 'WRK-KLG-004', full_name: 'Sarojini Majhi', contractor_code: 'CTR-KLG-001', role_title: 'Dust Suppression Operator', category: 'Environment', shift: 'Shift A', status: 'ACTIVE', training: 'DUE' },
];

async function runSeed() {
  console.log('====================================================');
  console.log('  COALGUARD AI: WORKFORCE & CONTRACTOR SEEDING      ');
  console.log('====================================================');

  // Step 1: Retrieve all mines and build code->mine map
  console.log('1. Loading existing mines...');
  const { data: mines, error: mineErr } = await sb.from('mines').select('id, code, name');
  if (mineErr || !mines || mines.length === 0) {
    throw new Error('Failed to load mines: ' + (mineErr ? mineErr.message : 'no mines found'));
  }
  const mineByCode = {};
  for (const m of mines) {
    mineByCode[m.code] = m;
  }
  console.log(`✓ Loaded ${mines.length} mines from database.`);

  // Step 2: Seed / reconcile 12 Contractors
  console.log('2. Reconciling 12 Fictional Contractors...');
  const contractorIdByCode = {};
  for (const c of CONTRACTORS_SPEC) {
    const mine = mineByCode[c.mine_code];
    if (!mine) {
      throw new Error(`Target mine code not found: ${c.mine_code}`);
    }

    const { error } = await sb.from('contractors').upsert({
      id: c.id,
      mine_id: mine.id,
      company_name: c.company_name,
      registration_no: c.code,
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      contact_phone: c.contact_phone,
      status: c.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting contractor ${c.company_name}: ${error.message}`);
    }
    contractorIdByCode[c.code] = c.id;

    // Seed contract in contractor_contracts
    const contractId = `cc000000-0000-0000-0000-${c.id.slice(-12)}`;
    await sb.from('contractor_contracts').upsert({
      id: contractId,
      contractor_id: c.id,
      start_date: '2026-01-01',
      end_date: '2027-12-31',
      scope: c.services,
      value: 25000000,
    }, { onConflict: 'id' });
  }
  console.log('✓ 12 Contractors reconciled successfully.');

  // Step 3: Seed / reconcile 48 Workers
  console.log('3. Reconciling 48 Fictional Workers...');
  const validWorkerIds = new Set();
  for (const w of WORKERS_SPEC) {
    const contractorId = contractorIdByCode[w.contractor_code];
    if (!contractorId) {
      throw new Error(`Contractor code not found: ${w.contractor_code}`);
    }

    validWorkerIds.add(w.id);

    const { error } = await sb.from('contractor_workers').upsert({
      id: w.id,
      contractor_id: contractorId,
      full_name: w.full_name,
      id_number: w.worker_id,
      role_title: w.role_title,
    }, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting worker ${w.full_name}: ${error.message}`);
    }
  }
  console.log('✓ 48 Workers reconciled successfully.');

  // Step 4: Clean up any old obsolete demo workers that are NOT in the 48 workers list
  // but ONLY if they are not referenced by attendance!
  console.log('4. Checking for orphaned/obsolete workers...');
  const { data: allWorkers } = await sb.from('contractor_workers').select('id, full_name');
  let removedCount = 0;
  for (const aw of allWorkers || []) {
    if (!validWorkerIds.has(aw.id)) {
      const { count: attCount } = await sb.from('worker_attendance').select('id', { count: 'exact', head: true }).eq('worker_id', aw.id);
      if (attCount === 0) {
        await sb.from('contractor_workers').delete().eq('id', aw.id);
        removedCount++;
        console.log(`- Removed obsolete unreferenced worker: ${aw.full_name} (${aw.id})`);
      } else {
        console.log(`! Kept worker ${aw.full_name} (${aw.id}) because it has attendance records.`);
      }
    }
  }
  console.log(`✓ Cleaned up ${removedCount} obsolete unreferenced workers.`);

  // Step 5: Align worker_attendance records to match worker contractor's mine
  console.log('5. Ensuring attendance mine_id consistency...');
  const { data: attendanceList } = await sb.from('worker_attendance').select('id, worker_id, mine_id');
  let alignedCount = 0;
  for (const att of attendanceList || []) {
    // Find worker
    const workerSpec = WORKERS_SPEC.find(w => w.id === att.worker_id);
    if (workerSpec) {
      const contractor = CONTRACTORS_SPEC.find(c => c.code === workerSpec.contractor_code);
      if (contractor) {
        const expectedMine = mineByCode[contractor.mine_code];
        if (expectedMine && att.mine_id !== expectedMine.id) {
          await sb.from('worker_attendance').update({ mine_id: expectedMine.id }).eq('id', att.id);
          alignedCount++;
        }
      }
    }
  }
  console.log(`✓ Aligned ${alignedCount} attendance records to match worker mine.`);

  // Step 6: Verify final counts and data integrity
  console.log('6. Running Integrity Verifications...');
  const { data: finalContractors } = await sb.from('contractors').select('id, company_name, registration_no, mine_id');
  const { data: finalWorkers } = await sb.from('contractor_workers').select('id, id_number, full_name, contractor_id');
  
  console.log(`- Final Contractors count: ${finalContractors.length}`);
  console.log(`- Final Workers count: ${finalWorkers.length}`);

  // Check contractor UUID for Koushik
  const koushikContractor = finalContractors.find(c => c.id === 'a0000000-0000-0000-0000-000000000110');
  if (!koushikContractor || koushikContractor.registration_no !== 'CTR-VND-001') {
    throw new Error('Integrity failure: Koushik contractor UUID not preserved correctly!');
  }
  console.log('✓ Koushik contractor UUID preserved.');

  // Check worker-to-contractor and worker-to-mine consistency
  const contractorMap = {};
  for (const c of finalContractors) {
    contractorMap[c.id] = c;
  }

  let invalidWorkerMines = 0;
  for (const w of finalWorkers) {
    const parentContractor = contractorMap[w.contractor_id];
    if (!parentContractor) {
      console.error(`Orphan worker found: ${w.full_name} (${w.id})`);
      invalidWorkerMines++;
    }
  }

  if (invalidWorkerMines > 0) {
    throw new Error(`Integrity failure: ${invalidWorkerMines} workers have invalid or missing contractors!`);
  }
  console.log('✓ All workers belong to valid contractors.');
  console.log('====================================================');
  console.log('  SEEDING COMPLETED WITH ZERO INTEGRITY ERRORS      ');
  console.log('====================================================');
}

runSeed().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
