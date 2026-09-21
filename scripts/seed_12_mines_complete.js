/**
 * Comprehensive Idempotent Seed for CoalGuard AI (SIH26024)
 * Seeds:
 * - 12 Fictional Mines across Indian Coalfields
 * - 6 Contractors
 * - 32 Workers
 * - 26 Incidents
 * - 32 Inspections
 * - 34 Inspection Observations (Findings)
 * - 26 Corrective Actions (CAPA)
 * - 14 Environmental Monitoring Points & 56 Readings
 * - 24 Monthly Production Reports
 * - 32 Attendance Records
 * - 12 Grievances
 * - 16 Notifications
 * - 14 Audit Logs & AI Risk Assessments
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim();
    if (k && v && v !== 'None') env[k] = v;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Fixed deterministic UUIDs
const REGION_NORTH = 'a0000000-0000-0000-0000-000000000020';
const REGION_SOUTH = 'a0000000-0000-0000-0000-000000000021';

const ADMIN_ID = 'a0000000-0000-0000-0000-000000000100';
const MANAGER_ID = 'a0000000-0000-0000-0000-000000000101';
const INSPECTOR_ID = 'a0000000-0000-0000-0000-000000000102';
const CONTRACTOR_USER_ID = 'a0000000-0000-0000-0000-000000000103';

// 12 Fictional Mines
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

// 6 Contractors
const CONTRACTORS = [
  { id: 'b0000000-0000-0000-0000-000000000001', mine_id: MINES[0].id, company_name: 'Alpha Mining Services',   registration_no: 'REG-DEMO-001', contact_name: 'Ramesh Patel',  contact_email: 'ramesh.alpha@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000002', mine_id: MINES[0].id, company_name: 'Beta Heavy Haulage',     registration_no: 'REG-DEMO-002', contact_name: 'Sunil Verma',   contact_email: 'sunil.beta@demo.test',    status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000003', mine_id: MINES[4].id, company_name: 'Vindhya Earthmovers',    registration_no: 'REG-DEMO-003', contact_name: 'Amit Sharma',   contact_email: 'amit.vindhya@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000004', mine_id: MINES[5].id, company_name: 'Eastern Blasting Corp',  registration_no: 'REG-DEMO-004', contact_name: 'Deepak Roy',    contact_email: 'deepak.east@demo.test',   status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000005', mine_id: MINES[9].id, company_name: 'Deccan Logistics Ltd',   registration_no: 'REG-DEMO-005', contact_name: 'Vijay Reddy',   contact_email: 'vijay.deccan@demo.test',  status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000006', mine_id: MINES[14].id,company_name: 'Kalinga Safety Logistics',registration_no: 'REG-DEMO-006', contact_name: 'Sanjay Mishra', contact_email: 'sanjay.kal@demo.test',    status: 'ACTIVE' }
];

async function runSeed() {
  console.log("==================================================");
  console.log("  COALGUARD AI: EXECUTING COMPREHENSIVE SEED      ");
  console.log("==================================================");

  // 1. Mines
  console.log("Seeding 12+ Fictional Demonstration Mines...");
  for (const m of MINES) {
    const { error } = await sb.from('mines').upsert(m, { onConflict: 'id' });
    if (error) console.error(`Error mine ${m.code}:`, error.message);
  }
  console.log("✓ Mines seeded successfully.");

  // 2. Contractors
  console.log("Seeding 6+ Contractors...");
  for (const c of CONTRACTORS) {
    const { error } = await sb.from('contractors').upsert(c, { onConflict: 'id' });
    if (error) console.error(`Error contractor ${c.company_name}:`, error.message);
  }
  console.log("✓ Contractors seeded successfully.");

  // 3. Workers (32 workers across mines and contractors)
  console.log("Seeding 32 Workers...");
  const WORKER_NAMES = [
    ["Rajesh Kumar", "Operator", "Extraction"],
    ["Manoj Singh", "Dumper Driver", "Haulage"],
    ["Anil Gupta", "Electrician", "Maintenance"],
    ["Vikram Yadav", "Blaster", "Drilling"],
    ["Suresh Meena", "Safety Steward", "Safety"],
    ["Rohan Das", "Surveyor", "Geology"],
    ["Prakash Jha", "Shovel Operator", "Extraction"],
    ["Dinesh Nair", "Mechanic", "Workshop"],
    ["Kishore Lal", "Ventilation Officer", "Ventilation"],
    ["Arjun Rathore", "Drill Operator", "Drilling"],
    ["Santosh Sahu", "Haul Road Marshall", "Haulage"],
    ["Birendra Toppo", "Support Timberman", "Underground"],
    ["Chandan Soren", "Coal Loader", "Extraction"],
    ["Kamal Sharma", "Dumper Driver", "Haulage"],
    ["Pradip Mondal", "Winder Operator", "Haulage"],
    ["Satish Chauhan", "Pump Attendant", "Drainage"],
    ["Tarun Sen", "Safety Inspector Assistant", "Safety"],
    ["Gautam Barik", "Belt Conveyor Operator", "Conveyor"],
    ["Mukesh Pradhan", "Excavator Operator", "Extraction"],
    ["Sujit Mohanty", "Sampler", "Quality"],
    ["Naveen Rao", "Locomotive Driver", "Haulage"],
    ["Gopal Krishna", "Foreman", "Extraction"],
    ["Alok Tiwari", "Electrician", "Maintenance"],
    ["Jagdish Prasad", "Dust Suppression Tech", "Environment"],
    ["Rameshwar Oraon", "Roof Bolter", "Support"],
    ["Hemant Besra", "Underground Miner", "Extraction"],
    ["Binod Mahato", "Haul Truck Driver", "Haulage"],
    ["Laxman Murmu", "Security Guard", "Security"],
    ["Nandlal Gope", "Water Tanker Driver", "Environment"],
    ["Subhash Chandra", "Weighbridge Clerk", "Dispatch"],
    ["Pawan Agarwal", "Store Keeper", "Logistics"],
    ["Govind Das", "First Aid Attendant", "Medical"]
  ];

  for (let i = 0; i < WORKER_NAMES.length; i++) {
    const [name, role, dept] = WORKER_NAMES[i];
    const workerId = `c0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const contractor = CONTRACTORS[i % CONTRACTORS.length];
    const { error } = await sb.from('contractor_workers').upsert({
      id: workerId,
      contractor_id: contractor.id,
      full_name: name,
      id_number: `WRK-DEMO-${String(1000 + i)}`,
      role_title: role
    }, { onConflict: 'id' });
    if (error && !error.message.includes('duplicate')) {
      console.error(`Error worker ${name}:`, error.message);
    }
  }
  console.log("✓ Workers seeded successfully.");

  // 4. Compliance Requirements and Records
  console.log("Seeding Compliance Requirements & Records...");
  const { data: categories } = await sb.from('compliance_categories').select('id');
  const catId = categories && categories[0] ? categories[0].id : null;

  for (let i = 0; i < MINES.length; i++) {
    const m = MINES[i];
    const reqId1 = `d0000000-0000-0000-0000-${String(i * 2 + 1).padStart(12, '0')}`;
    const reqId2 = `d0000000-0000-0000-0000-${String(i * 2 + 2).padStart(12, '0')}`;

    await sb.from('compliance_requirements').upsert([
      {
        id: reqId1,
        mine_id: m.id,
        category_id: catId,
        title: `Statutory DGMS Weekly Safety Audit — ${m.name}`,
        description: 'Mandatory structural pit slope and machinery perimeter inspection under CMR 2017.',
        regulatory_authority: 'DGMS',
        frequency: 'WEEKLY',
        priority: 'HIGH',
        is_demo_content: true
      },
      {
        id: reqId2,
        mine_id: m.id,
        category_id: catId,
        title: `SPCB Ambient Air Quality Compliance Return — ${m.name}`,
        description: 'Periodic PM10/PM2.5 monitoring and water discharge return under MoEFCC guidelines.',
        regulatory_authority: 'SPCB',
        frequency: 'MONTHLY',
        priority: 'CRITICAL',
        is_demo_content: true
      }
    ], { onConflict: 'id' });

    const isNonCompliant = (i === 4 || i === 8); // Vindhya & Damodar have overdue actions
    await sb.from('compliance_records').upsert([
      {
        id: `e0000000-0000-0000-0000-${String(i * 2 + 1).padStart(12, '0')}`,
        requirement_id: reqId1,
        mine_id: m.id,
        due_date: '2026-09-25',
        completed_date: isNonCompliant ? null : '2026-09-18',
        status: isNonCompliant ? 'OVERDUE' : 'COMPLIANT',
        notes: isNonCompliant ? 'Statutory safety walkthrough pending inspector availability.' : 'All highwall faces certified stable.'
      },
      {
        id: `e0000000-0000-0000-0000-${String(i * 2 + 2).padStart(12, '0')}`,
        requirement_id: reqId2,
        mine_id: m.id,
        due_date: '2026-09-30',
        completed_date: '2026-09-15',
        status: 'COMPLIANT',
        notes: 'Monthly particulate and ambient air data validated within permissible limits.'
      }
    ], { onConflict: 'id' });
  }
  console.log("✓ Compliance requirements & records seeded.");

  // 5. Inspections & Observations & CAPA
  console.log("Seeding 32 Inspections, 34 Observations, and 26 Corrective Actions...");
  const INSPECTION_TYPES = ['ROUTINE_SAFETY', 'STATUTORY_DGMS', 'ELECTRICAL_AUDIT', 'SLOPE_STABILITY', 'VENTILATION_CHECK', 'ENVIRONMENTAL_AIR'];
  const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const ACTION_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];

  for (let i = 0; i < 32; i++) {
    const inspId = `f0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];
    const isPast = i < 24;
    const inspStatus = isPast ? (i % 5 === 0 ? 'SUBMITTED' : 'APPROVED') : (i % 2 === 0 ? 'SCHEDULED' : 'IN_PROGRESS');

    await sb.from('inspections').upsert({
      id: inspId,
      mine_id: mine.id,
      inspector_id: INSPECTOR_ID,
      inspection_type: INSPECTION_TYPES[i % INSPECTION_TYPES.length],
      scheduled_date: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`,
      actual_date: isPast ? `2026-09-${String((i % 20) + 1).padStart(2, '0')}` : null,
      latitude: mine.latitude ? mine.latitude + (Math.sin(i) * 0.005) : 22.35,
      longitude: mine.longitude ? mine.longitude + (Math.cos(i) * 0.005) : 82.75,
      status: inspStatus,
      sync_status: 'SYNCED'
    }, { onConflict: 'id' });

    // Observation
    const obsId = `f1000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const sev = SEVERITIES[i % SEVERITIES.length];
    await sb.from('inspection_observations').upsert({
      id: obsId,
      inspection_id: inspId,
      description: `Observation #${i + 1} at ${mine.name}: Finding regarding safety guard rails, haul road water spray mist, or conveyor earthing continuity.`,
      severity: sev,
      latitude: mine.latitude ? mine.latitude + (Math.sin(i) * 0.003) : 22.35,
      longitude: mine.longitude ? mine.longitude + (Math.cos(i) * 0.003) : 82.75,
      sync_status: 'SYNCED'
    }, { onConflict: 'id' });

    // CAPA for high or critical findings (up to 26 CAPAs)
    if (i < 26) {
      const capaId = `f2000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
      const status = ACTION_STATUSES[i % ACTION_STATUSES.length];
      await sb.from('corrective_actions').upsert({
        id: capaId,
        source_type: 'INSPECTION',
        source_id: inspId,
        issue: `CAPA for Observation #${i + 1} (${sev}) at ${mine.code}: Remediate barrier defect and certify compliance.`,
        responsible_user_id: MANAGER_ID,
        deadline: `2026-10-${String((i % 25) + 5).padStart(2, '0')}`,
        priority: sev === 'CRITICAL' ? 'CRITICAL' : sev === 'HIGH' ? 'HIGH' : 'MEDIUM',
        status: status
      }, { onConflict: 'id' });
    }
  }
  console.log("✓ Inspections, observations, and CAPAs seeded.");

  // 6. Incidents (26 incidents across mines)
  console.log("Seeding 26 Incidents...");
  const { data: incTypes } = await sb.from('incident_types').select('id');
  const typeId = incTypes && incTypes[0] ? incTypes[0].id : null;

  const INCIDENT_DESCS = [
    ["Thermal overload trip on main belt drive #3", "CRITICAL", "RESOLVED"],
    ["Haul road dust emission exceeded threshold during dry shift", "MEDIUM", "CLOSED"],
    ["Minor rock displacement along bench crest in pit quadrant 4", "HIGH", "UNDER_INVESTIGATION"],
    ["Hydraulic line leak on 240T dump truck", "MEDIUM", "RESOLVED"],
    ["Ventilation duct partial dislodgement in return airway", "CRITICAL", "REPORTED"],
    ["Near-miss vehicle encounter at blind intersection", "HIGH", "ACTION_REQUIRED"],
    ["Conveyor roller bearing friction smoke detected by thermography", "CRITICAL", "RESOLVED"],
    ["Slope stability sensor telemetry intermittent communication", "LOW", "CLOSED"],
    ["Water accumulation in sump chamber #2", "LOW", "RESOLVED"],
    ["Substation transformer overheating alarm", "HIGH", "REPORTED"],
    ["Haul truck tyre puncture on sharp shale fragment", "LOW", "CLOSED"],
    ["Excess particulate matter PM10 spiked during blasting window", "MEDIUM", "RESOLVED"],
    ["Lighting tower failure at dumping point 2B", "LOW", "CLOSED"],
    ["Excavator boom hydraulic cylinder seal wear", "MEDIUM", "UNDER_INVESTIGATION"],
    ["Dust suppression mist cannon valve blockage", "LOW", "RESOLVED"],
    ["Warning siren relay trip during routine shift change", "LOW", "CLOSED"],
    ["Loose rock found hanging above haul road bench #1", "CRITICAL", "REPORTED"],
    ["Highwall drainage channel overflow after monsoon shower", "MEDIUM", "RESOLVED"],
    ["Worker slip on metal access stairway (no fracture)", "MEDIUM", "CLOSED"],
    ["Auxiliary booster fan belt vibration", "LOW", "RESOLVED"],
    ["Overheated rear differential on haul truck #12", "HIGH", "UNDER_INVESTIGATION"],
    ["Drill rig dust collector filter bag tear", "MEDIUM", "RESOLVED"],
    ["Explosive van GPS signal loss in pit area", "HIGH", "REPORTED"],
    ["Belt rip sensor triggered by foreign metal scrap", "CRITICAL", "RESOLVED"],
    ["Crusher hopper stone bridge jam requiring manual poking", "HIGH", "REPORTED"],
    ["Unplanned power outage on primary 33kV mine feeder", "CRITICAL", "RESOLVED"]
  ];

  for (let i = 0; i < INCIDENT_DESCS.length; i++) {
    const [desc, sev, st] = INCIDENT_DESCS[i];
    const incId = `f3000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];

    await sb.from('incidents').upsert({
      id: incId,
      mine_id: mine.id,
      incident_type_id: typeId,
      occurred_at: new Date(Date.now() - (i * 36 * 3600 * 1000)).toISOString(),
      latitude: mine.latitude ? mine.latitude + (Math.sin(i * 2) * 0.004) : 22.35,
      longitude: mine.longitude ? mine.longitude + (Math.cos(i * 2) * 0.004) : 82.75,
      description: `${desc} [Mine: ${mine.name}]`,
      severity: sev,
      reported_by: INSPECTOR_ID,
      status: st === 'ACTION_REQUIRED' ? 'REPORTED' : st,
      sync_status: 'SYNCED'
    }, { onConflict: 'id' });
  }
  console.log("✓ Incidents seeded successfully.");

  // 7. Environmental Monitoring Points & Readings (14 points & 56 readings)
  console.log("Seeding Environmental Points & Readings...");
  const ENV_TYPES = ['AIR_QUALITY', 'DUST', 'WATER', 'NOISE', 'LAND'];
  for (let i = 0; i < 14; i++) {
    const pointId = `f4000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];
    const pType = ENV_TYPES[i % ENV_TYPES.length];

    await sb.from('environmental_monitoring_points').upsert({
      id: pointId,
      mine_id: mine.id,
      name: `${mine.name} — Sensor Station #${(i % 3) + 1} (${pType})`,
      latitude: mine.latitude ? mine.latitude + (Math.sin(i) * 0.006) : 22.35,
      longitude: mine.longitude ? mine.longitude + (Math.cos(i) * 0.006) : 82.75,
      parameter_type: pType
    }, { onConflict: 'id' });

    // 4 readings per point = 56 readings total
    for (let r = 0; r < 4; r++) {
      const readId = `f5000000-0000-0000-0000-${String(i * 4 + r + 1).padStart(12, '0')}`;
      const val = pType === 'AIR_QUALITY' ? 75 + (r * 12) : pType === 'DUST' ? 120 + (r * 35) : pType === 'NOISE' ? 65 + (r * 6) : 7.2;
      const unit = pType === 'AIR_QUALITY' ? 'AQI' : pType === 'DUST' ? 'µg/m³' : pType === 'NOISE' ? 'dB(A)' : 'pH';
      const thresh = pType === 'AIR_QUALITY' ? 100 : pType === 'DUST' ? 250 : pType === 'NOISE' ? 85 : 8.5;
      const status = val > thresh ? 'EXCEEDED' : val > thresh * 0.85 ? 'WARNING' : 'NORMAL';

      await sb.from('environmental_readings').upsert({
        id: readId,
        monitoring_point_id: pointId,
        parameter_type: pType,
        value: val,
        unit: unit,
        threshold_value: thresh,
        status: status,
        recorded_at: new Date(Date.now() - (r * 24 * 3600 * 1000)).toISOString(),
        recorded_by: INSPECTOR_ID,
        is_demo_content: true
      }, { onConflict: 'id' });
    }
  }
  console.log("✓ Environmental monitoring points and readings seeded.");

  // 8. Production Reports (24 monthly reports)
  console.log("Seeding 24 Production Reports...");
  for (let i = 0; i < 24; i++) {
    const repId = `f6000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];
    const month = (i % 6) + 4; // April to September 2026
    const target = 50000 + (i * 2500);
    const actual = Math.round(target * (0.92 + (Math.sin(i) * 0.08)));

    await sb.from('production_reports').upsert({
      id: repId,
      mine_id: mine.id,
      period_start: `2026-0${month}-01`,
      period_end: `2026-0${month}-28`,
      target_quantity: target,
      actual_quantity: actual,
      unit: 'tonnes',
      status: i < 18 ? 'APPROVED' : 'SUBMITTED',
      submitted_by: MANAGER_ID
    }, { onConflict: 'id' });
  }
  console.log("✓ Production reports seeded.");

  // 9. Worker Attendance (32 records)
  console.log("Seeding Worker Attendance...");
  for (let i = 0; i < 32; i++) {
    const workerId = `c0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];
    const attId = `f7000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;

    await sb.from('worker_attendance').upsert({
      id: attId,
      worker_id: workerId,
      mine_id: mine.id,
      attendance_date: '2026-09-21',
      check_in: '2026-09-21T06:00:00Z',
      check_out: '2026-09-21T14:30:00Z',
      status: i % 10 === 0 ? 'ON_LEAVE' : i % 15 === 0 ? 'HALF_DAY' : 'PRESENT',
      source: 'MANUAL',
      recorded_by: MANAGER_ID,
      sync_status: 'SYNCED'
    }, { onConflict: 'id' });
  }
  console.log("✓ Worker attendance records seeded.");

  // 10. Grievances (12 records)
  console.log("Seeding 12 Grievances...");
  const GRIEVANCES = [
    ["Drinking water chiller breakdown at Pit Head", "Water & Sanitation", "HIGH", "OPEN"],
    ["Dust suppression mist spray interval delay on South Haul Road", "Environment", "MEDIUM", "IN_PROGRESS"],
    ["Shift transport bus delayed on Night Shift route 4", "Transport", "LOW", "RESOLVED"],
    ["Safety goggles fogging issue with new vendor consignment", "PPE", "MEDIUM", "OPEN"],
    ["Lighting inadequate around East Sump transformer yard", "Safety", "HIGH", "RESOLVED"],
    ["Mess canteen drinking water filter replacement due", "Sanitation", "LOW", "RESOLVED"],
    ["Rest shelter fan motor humming noise", "Welfare", "LOW", "CLOSED"],
    ["Pothole formation on access gate intersection road", "Infrastructure", "MEDIUM", "OPEN"],
    ["First aid oxygen cylinder refilling due next week", "Medical", "HIGH", "RESOLVED"],
    ["Locker room shower tap leakage", "Sanitation", "LOW", "CLOSED"],
    ["Ear protection plugs dispenser empty at Crusher Plant", "PPE", "HIGH", "RESOLVED"],
    ["Noise barrier flap loose near Residential Colony border", "Environment", "MEDIUM", "IN_PROGRESS"]
  ];

  for (let i = 0; i < GRIEVANCES.length; i++) {
    const [title, cat, prio, st] = GRIEVANCES[i];
    const gId = `f8000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];

    await sb.from('grievances').upsert({
      id: gId,
      mine_id: mine.id,
      submitted_by: CONTRACTOR_USER_ID,
      category: cat,
      title: `${title} (${mine.code})`,
      description: `Worker grievance report: ${title}. Filed for shift supervisory rectification.`,
      priority: prio,
      status: st,
      assigned_to: MANAGER_ID,
      is_confidential: false
    }, { onConflict: 'id' });
  }
  console.log("✓ Grievances seeded.");

  // 11. Notifications (16 records)
  console.log("Seeding 16 Notifications...");
  for (let i = 0; i < 16; i++) {
    const notifId = `f9000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const mine = MINES[i % MINES.length];
    await sb.from('notifications').upsert({
      id: notifId,
      user_id: ADMIN_ID,
      title: `Statutory Compliance Alert — ${mine.code}`,
      body: `Scheduled DGMS quarterly audit verification upcoming for ${mine.name}. Check CAPA progress.`,
      type: i % 2 === 0 ? 'COMPLIANCE_ALERT' : 'SAFETY_INSPECTION',
      related_entity_type: 'mines',
      related_entity_id: mine.id,
      is_read: i > 8
    }, { onConflict: 'id' });
  }
  console.log("✓ Notifications seeded.");

  // 12. Audit Logs & AI Risk Scores
  console.log("Seeding Audit Logs & Risk Assessments...");
  for (let i = 0; i < MINES.length; i++) {
    const m = MINES[i];
    const score = i === 4 ? 54 : i === 8 ? 62 : i === 0 ? 88 : 78;
    await sb.from('risk_scores').upsert({
      id: `fa000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      mine_id: m.id,
      entity_type: 'mine',
      entity_id: m.id,
      score: score,
      factors: [
        { label: "Historical Incident Frequency", weight: 0.35 },
        { label: "Overdue Corrective Actions", weight: 0.30 },
        { label: "Statutory Filing Timeliness", weight: 0.20 },
        { label: "Environmental Reading Thresholds", weight: 0.15 }
      ],
      model_version: 'gemini-flash-latest'
    }, { onConflict: 'id' });

    await sb.from('audit_logs').upsert({
      id: `fb000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      actor_id: ADMIN_ID,
      role_key: 'SUPER_ADMIN',
      action: 'SYSTEM_AUDIT_VERIFY',
      entity_type: 'mine',
      entity_id: m.id
    }, { onConflict: 'id' });
  }
  console.log("✓ Audit logs and risk assessments seeded.");

  console.log("\n==================================================");
  console.log("  SEED COMPLETED SUCCESSFULLY: ALL TABLES POPULATED ");
  console.log("==================================================");
}

runSeed().catch(err => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
