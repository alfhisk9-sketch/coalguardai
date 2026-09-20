const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'];
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const DEMO_PASSWORD = 'demo123';

const TEST_PERSONAS = [
  { name: "Alfhi", role: "SUPER_ADMIN", email: "alfhi.demo@sih26024.test", expectedMines: 4 },
  { name: "Rabbani", role: "CORPORATE_ADMIN", email: "rabbani.demo@sih26024.test", expectedMines: 4 },
  { name: "Akshay", role: "MINE_MANAGER", email: "akshay.demo@sih26024.test", expectedMines: 1 },
  { name: "Krishna", role: "INSPECTOR", email: "krishna.demo@sih26024.test", expectedMines: 1 },
  { name: "Koushik", role: "CONTRACTOR", email: "koushik.demo@sih26024.test", expectedMines: 0 },
  { name: "Hema", role: "REGULATOR", email: "hema.demo@sih26024.test", expectedMines: 1 },
];

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function runVerification() {
  console.log("===============================================================");
  console.log("   COALGUARD AI — FULL AUTH, DOCUMENTS & GIS INTEGRATION TEST  ");
  console.log("===============================================================");
  console.log(`Target Supabase URL: ${supabaseUrl}`);

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name, condition, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${name} ${details ? `(${details})` : ""}`);
    } else {
      console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Authenticate all 6 named demo personas with demo123
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 1] DEMO AUTHENTICATION & TOKEN ACQUISITION");
  const tokens = {};

  for (const p of TEST_PERSONAS) {
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: p.email,
      password: DEMO_PASSWORD,
    });

    assertTest(
      `Sign-in for [${p.role}] ${p.name} (${p.email})`,
      !authError && authData?.session?.access_token,
      authError ? authError.message : `Token length: ${authData.session.access_token.length}`
    );

    if (authData?.session?.access_token) {
      tokens[p.role] = authData.session.access_token;
    }
  }

  // -------------------------------------------------------------
  // 2. RLS Enforcement for Scoped Personas
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 2] RLS MINE ACCESS SCOPING");
  for (const p of TEST_PERSONAS) {
    if (!tokens[p.role]) continue;
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${tokens[p.role]}` } },
      auth: { persistSession: false },
    });

    const { data: mines, error: minesErr } = await client.from('mines').select('id, code, name');
    assertTest(
      `RLS Mine Scoping for [${p.role}]`,
      !minesErr && (mines?.length ?? 0) === p.expectedMines,
      `Expected ${p.expectedMines} mines, received ${mines?.length ?? 0}`
    );
  }

  // -------------------------------------------------------------
  // 3. Document Query with Demo Alias insp-001 (Inspection UUID: a0000000-0000-0000-0000-000000000230)
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 3] DOCUMENTS API & DEMO ALIAS RETRIEVAL");
  const superAdminClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` } },
    auth: { persistSession: false },
  });

  // Query documents table directly for inspection owner
  const DEMO_INSPECTION_UUID = 'a0000000-0000-0000-0000-000000000230';
  const { data: docs, error: docErr } = await superAdminClient
    .from('documents')
    .select('id, file_name, mime_type, owner_type, owner_id, extracted_text')
    .eq('owner_type', 'INSPECTION')
    .eq('owner_id', DEMO_INSPECTION_UUID);

  assertTest(
    "Inspection document exists for demo inspection UUID",
    !docErr && docs && docs.length > 0,
    docs && docs[0] ? `File: ${docs[0].file_name}` : "No document found"
  );

  if (docs && docs[0]) {
    assertTest(
      "Document contains valid OCR extracted text",
      docs[0].extracted_text && docs[0].extracted_text.includes("STATUTORY INSPECTION REPORT"),
      `Text snippet: ${docs[0].extracted_text.substring(0, 45)}...`
    );
  }

  // -------------------------------------------------------------
  // 4. GIS Spatial Coordinates & Distance Verification
  // -------------------------------------------------------------
  console.log("\n[TEST SUITE 4] GIS COORDINATE INTEGRITY & HAVERSINE DISTANCE");
  const { data: allMines, error: allMinesErr } = await superAdminClient
    .from('mines')
    .select('id, name, code, latitude, longitude, status');

  assertTest("Fetch mine coordinates for GIS", !allMinesErr && allMines.length >= 4, `${allMines?.length} mines loaded`);

  let validCoordsCount = 0;
  for (const m of allMines || []) {
    const valid =
      typeof m.latitude === 'number' &&
      typeof m.longitude === 'number' &&
      m.latitude >= -90 &&
      m.latitude <= 90 &&
      m.longitude >= -180 &&
      m.longitude <= 180;
    if (valid) validCoordsCount++;
  }

  assertTest(
    "All mine coordinates within valid geographic bounds (-90..90, -180..180)",
    validCoordsCount === (allMines?.length ?? 0),
    `${validCoordsCount}/${allMines?.length} valid`
  );

  // Test Haversine distance calculation: Shakti OCP (23.2599, 82.3616) to Surya (23.4102, 82.4501)
  const shakti = allMines?.find(m => m.code === 'SHK-DEMO');
  const surya = allMines?.find(m => m.code === 'SUR-DEMO');
  if (shakti && surya) {
    const dist = calculateHaversineKm(shakti.latitude, shakti.longitude, surya.latitude, surya.longitude);
    assertTest(
      "Haversine distance between Shakti OCP and Surya Mine is plausible (~18-20 km)",
      dist > 15 && dist < 25,
      `Calculated: ${dist.toFixed(2)} km`
    );
  }

  console.log("\n===============================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(0)}%)`);
  console.log("===============================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
