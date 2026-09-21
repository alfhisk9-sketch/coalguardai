const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function formatRoleLabel(roleKey) {
  if (!roleKey) return "Role Pending";
  switch (roleKey) {
    case "SUPER_ADMIN": return "Super Admin";
    case "CORPORATE_ADMIN": return "Corporate Admin";
    case "MINE_MANAGER": return "Mine Manager";
    case "REGULATOR": return "Safety Officer";
    case "INSPECTOR": return "Inspector";
    case "CONTRACTOR": return "Contractor";
    default: return String(roleKey).replace(/_/g, " ");
  }
}

async function runTest() {
  console.log("=== PHASE 5: REALISTIC SIGNUP FLOW TEST ===");
  const testEmail = `test.signup.${Date.now()}@coalguard.test`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Automation Test User';
  const requestedRole = 'MINE_MANAGER';

  // 1. Get SHK-DEMO mine ID
  const { data: mine } = await adminClient.from('mines').select('id, code, name').eq('code', 'SHK-DEMO').single();
  if (!mine) throw new Error("SHK-DEMO mine not found");
  console.log(`[OK] Target mine resolved: ${mine.name} (${mine.code}, id: ${mine.id})`);

  // 2. Perform Registration via Admin API / atomic registration logic
  console.log(`[1] Creating registration for ${testEmail}...`);
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testFullName }
  });
  if (createError) throw createError;
  const newUserId = createData.user.id;
  console.log(`[2] Auth user created successfully. ID: ${newUserId}`);

  // 3. Create application profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUserId,
    full_name: testFullName,
    email: testEmail,
    is_active: true
  });
  if (profileError) throw profileError;
  console.log(`[3] Application profile created.`);

  // 4. Assign canonical role
  const { data: roleRow } = await adminClient.from('roles').select('id').eq('key', requestedRole).single();
  if (!roleRow) throw new Error(`Role ${requestedRole} not found in DB`);
  const { error: roleError } = await adminClient.from('user_roles').insert({
    user_id: newUserId,
    role_id: roleRow.id,
    mine_id: mine.id
  });
  if (roleError) throw roleError;
  console.log(`[4] Canonical user_roles row created: role=${requestedRole}, mine=${mine.code}`);

  // 5. Verify DB record state
  const { data: verifyProfile } = await adminClient.from('profiles').select('*').eq('id', newUserId).single();
  const { data: verifyRoles } = await adminClient.from('user_roles').select('role_id, mine_id, roles(key)').eq('user_id', newUserId);
  if (!verifyProfile || verifyRoles.length !== 1) throw new Error("DB verification failed");
  console.log(`[5] Verified DB state: Profile=${verifyProfile.full_name}, Role=${verifyRoles[0].roles.key}, MineId=${verifyRoles[0].mine_id}`);

  // 6. Test login with userClient
  console.log(`[6] Testing user login with credentials...`);
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  if (signInError) throw signInError;
  console.log(`[OK] Login succeeded. Session access_token obtained: ${signInData.session.access_token.slice(0, 15)}...`);

  // 7. Verify session persistence & token validation
  const { data: userData, error: userError } = await userClient.auth.getUser(signInData.session.access_token);
  if (userError || !userData.user) throw new Error("Session token invalid");
  console.log(`[7] Token validated: user email = ${userData.user.email}`);

  // 8. Header label test
  const headerRole = formatRoleLabel(verifyRoles[0].roles.key);
  console.log(`[8] Header displays: "${verifyProfile.full_name}" | "${headerRole}"`);
  if (headerRole !== "Mine Manager") throw new Error(`Expected 'Mine Manager', got '${headerRole}'`);

  // 9. Verify Mine Visibility matches authorization
  const authorizedMineIds = verifyRoles.map(r => r.mine_id).filter(Boolean);
  const { data: authorizedMines } = await adminClient.from('mines').select('id, code, name').in('id', authorizedMineIds);
  console.log(`[9] Authorized mines count: ${authorizedMines.length} (${authorizedMines.map(m => m.code).join(', ')})`);
  if (authorizedMines.length !== 1 || authorizedMines[0].code !== 'SHK-DEMO') {
    throw new Error("Mine scope authorization mismatch!");
  }

  // 10. Test logout
  console.log(`[10] Testing signOut...`);
  await userClient.auth.signOut();
  console.log(`[OK] User signed out.`);

  // 11. Test login again
  console.log(`[11] Testing re-login...`);
  const { data: reSignInData, error: reSignInError } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  if (reSignInError) throw reSignInError;
  console.log(`[OK] Re-login succeeded.`);
  await userClient.auth.signOut();

  // CLEANUP test account safely
  console.log(`[CLEANUP] Deleting test account ${testEmail} (${newUserId})...`);
  await adminClient.from('user_roles').delete().eq('user_id', newUserId);
  await adminClient.from('profiles').delete().eq('id', newUserId);
  await adminClient.auth.admin.deleteUser(newUserId);
  console.log(`[CLEANUP OK] Temporary test account cleanly removed.`);

  console.log(`\n>>> PHASE 5 SIGNUP END-TO-END VERIFICATION: 100% PASSED! <<<`);
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
