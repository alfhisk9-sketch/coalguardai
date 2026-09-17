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
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000100', email: 'admin.demo@sih26024.test' },
  { id: 'a0000000-0000-0000-0000-000000000101', email: 'manager.shakti.demo@sih26024.test' },
  { id: 'a0000000-0000-0000-0000-000000000102', email: 'inspector.shakti.demo@sih26024.test' },
  { id: 'a0000000-0000-0000-0000-000000000103', email: 'contractor.alpha.demo@sih26024.test' },
  { id: 'a0000000-0000-0000-0000-000000000104', email: 'regulator.demo@sih26024.test' }
];

async function setupAuth() {
  console.log("Configuring demo user passwords via official Supabase Admin API...");
  for (const u of DEMO_USERS) {
    const { data, error } = await adminClient.auth.admin.updateUserById(u.id, {
      password: 'CoalGuard@2026',
      email_confirm: true
    });
    if (error) {
      console.error(`Error updating user ${u.email}:`, error.message);
    } else {
      console.log(`✓ Updated auth credentials for ${u.email} (confirmed: ${!!data.user.email_confirmed_at})`);
    }
  }
}

setupAuth().catch(err => {
  console.error("Auth setup error:", err);
  process.exit(1);
});
