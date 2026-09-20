const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read server-only Supabase credentials from apps/web/.env.local
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file at:", envPath);
  process.exit(1);
}

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
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PASSWORD = 'demo123';

const NAMED_PERSONAS = [
  {
    id: 'a0000000-0000-0000-0000-000000000100',
    email: 'alfhi.demo@sih26024.test',
    fullName: 'Alfhi',
    roleKey: 'SUPER_ADMIN',
    roleId: 'a0000000-0000-0000-0000-000000000040',
    mineId: null,
    contractorId: null
  },
  {
    id: 'a0000000-0000-0000-0000-000000000105',
    email: 'rabbani.demo@sih26024.test',
    fullName: 'Rabbani',
    roleKey: 'CORPORATE_ADMIN',
    roleId: 'a0000000-0000-0000-0000-000000000041',
    mineId: null,
    contractorId: null
  },
  {
    id: 'a0000000-0000-0000-0000-000000000101',
    email: 'akshay.demo@sih26024.test',
    fullName: 'Akshay',
    roleKey: 'MINE_MANAGER',
    roleId: 'a0000000-0000-0000-0000-000000000042',
    mineId: 'a0000000-0000-0000-0000-000000000030', // Shakti Open Cast Mine
    contractorId: null
  },
  {
    id: 'a0000000-0000-0000-0000-000000000102',
    email: 'krishna.demo@sih26024.test',
    fullName: 'Krishna',
    roleKey: 'INSPECTOR',
    roleId: 'a0000000-0000-0000-0000-000000000043',
    mineId: 'a0000000-0000-0000-0000-000000000030',
    contractorId: null
  },
  {
    id: 'a0000000-0000-0000-0000-000000000103',
    email: 'koushik.demo@sih26024.test',
    fullName: 'Koushik',
    roleKey: 'CONTRACTOR',
    roleId: 'a0000000-0000-0000-0000-000000000044',
    mineId: null,
    contractorId: 'a0000000-0000-0000-0000-000000000110' // Alpha Mining Services
  },
  {
    id: 'a0000000-0000-0000-0000-000000000104',
    email: 'hema.demo@sih26024.test',
    fullName: 'Hema',
    roleKey: 'REGULATOR',
    roleId: 'a0000000-0000-0000-0000-000000000045',
    mineId: 'a0000000-0000-0000-0000-000000000030',
    contractorId: null
  },
  // Backward compatibility with previous admin.demo, etc.
  {
    id: 'a0000000-0000-0000-0000-000000000106',
    email: 'admin.demo@sih26024.test',
    fullName: 'Demo Super Admin',
    roleKey: 'SUPER_ADMIN',
    roleId: 'a0000000-0000-0000-0000-000000000040',
    mineId: null,
    contractorId: null
  }
];

async function provisionDemoUsers() {
  console.log("==================================================");
  console.log("  PROVISIONING SERVER-SIDE DEMO USERS (Idempotent)");
  console.log("==================================================");

  // 1. Fetch existing auth users to avoid duplicates
  const { data: userList, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 100 });
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existingUsersByEmail = new Map();
  const existingUsersById = new Map();
  (userList.users || []).forEach(u => {
    if (u.email) existingUsersByEmail.set(u.email.toLowerCase(), u);
    existingUsersById.set(u.id, u);
  });

  for (const persona of NAMED_PERSONAS) {
    let userId = persona.id;
    const existingByEmail = existingUsersByEmail.get(persona.email.toLowerCase());
    const existingById = existingUsersById.get(persona.id);

    if (existingByEmail) {
      userId = existingByEmail.id;
      // Update password & confirm email
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName }
      });
      if (updateErr) {
        console.warn(`[WARN] Could not update auth user ${persona.email}:`, updateErr.message);
      } else {
        console.log(`✓ Updated existing auth account: ${persona.email}`);
      }
    } else if (existingById) {
      // User with this ID exists under another email, update email & password
      userId = existingById.id;
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
        email: persona.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName }
      });
      if (updateErr) {
        console.warn(`[WARN] Could not update auth user by ID ${persona.id}:`, updateErr.message);
      } else {
        console.log(`✓ Realigned auth ID ${persona.id} to ${persona.email}`);
      }
    } else {
      // Create fresh user
      const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
        id: persona.id,
        email: persona.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName }
      });
      if (createErr) {
        console.warn(`[WARN] Could not create auth user ${persona.email}:`, createErr.message);
      } else if (createdUser && createdUser.user) {
        userId = createdUser.user.id;
        console.log(`✓ Created new auth account: ${persona.email}`);
      }
    }

    // 2. Ensure profile record exists
    const profilePayload = {
      id: userId,
      full_name: persona.fullName,
      email: persona.email,
      contractor_id: persona.contractorId,
      is_active: true
    };
    const { error: profileErr } = await adminClient
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });
    if (profileErr) {
      console.warn(`[WARN] Profile upsert warning for ${persona.email}:`, profileErr.message);
    } else {
      console.log(`  -> Profile synchronized for ${persona.fullName}`);
    }

    // 3. Ensure role record exists
    // Delete conflicting role for this user first to keep clean single role
    await adminClient.from('user_roles').delete().eq('user_id', userId);
    const { error: roleErr } = await adminClient.from('user_roles').insert({
      user_id: userId,
      role_id: persona.roleId,
      mine_id: persona.mineId
    });
    if (roleErr) {
      console.warn(`[WARN] Role assignment warning for ${persona.email}:`, roleErr.message);
    } else {
      console.log(`  -> Role [${persona.roleKey}] assigned.`);
    }
  }

  // 4. Provision Inspection Demo Document for insp-001 (UUID: a0000000-0000-0000-0000-000000000230)
  console.log("\nSynchronizing Demo Inspection Document for insp-001...");
  const inspectionDoc = {
    id: 'a0000000-0000-0000-0000-000000000402',
    mine_id: 'a0000000-0000-0000-0000-000000000030',
    owner_type: 'INSPECTION',
    owner_id: 'a0000000-0000-0000-0000-000000000230',
    storage_path: 'inspections/shakti/dgms-statutory-inspection-insp-001.pdf',
    file_name: 'DGMS_Statutory_Inspection_Report_insp-001.pdf',
    mime_type: 'application/pdf',
    uploaded_by: 'a0000000-0000-0000-0000-000000000102',
    processing_status: 'PROCESSED',
    extracted_text: 'DIRECTORATE GENERAL OF MINES SAFETY (DGMS)\nSTATUTORY INSPECTION REPORT - ROUTINE SAFETY ASSESSMENT\nRECORD REF: DGMS/CIL/SECL/SHK/INSP-001\nMINE: SHAKTI OPEN CAST MINE (SHK-DEMO)\nINSPECTION STATUS: APPROVED\nCRITICAL OBSERVATION: Protective guard rail missing near conveyor belt 3 drive head. Immediate barrier erection mandated under CMR 2017 Regulation 184.\nSTATUTORY COMPLIANCE: 92% Compliance Rating. No imminent danger notice issued.'
  };

  const { error: docErr } = await adminClient.from('documents').upsert(inspectionDoc, { onConflict: 'id' });
  if (docErr) {
    console.warn("[WARN] Document upsert warning:", docErr.message);
  } else {
    console.log("✓ Demo Inspection Document for insp-001 synchronized.");
  }

  console.log("\n==================================================");
  console.log("  DEMO PROVISIONING COMPLETED SUCCESSFULLY");
  console.log("==================================================");
}

provisionDemoUsers().catch(err => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
