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

const NAMED_DEMO_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000601', email: 'alfhi.demo@sih26024.test', name: 'Alfhi' },
  { id: 'a0000000-0000-0000-0000-000000000602', email: 'rabbani.demo@sih26024.test', name: 'Rabbani' },
  { id: 'a0000000-0000-0000-0000-000000000603', email: 'akshay.demo@sih26024.test', name: 'Akshay' },
  { id: 'a0000000-0000-0000-0000-000000000604', email: 'krishna.demo@sih26024.test', name: 'Krishna' },
  { id: 'a0000000-0000-0000-0000-000000000605', email: 'koushik.demo@sih26024.test', name: 'Koushik' },
  { id: 'a0000000-0000-0000-0000-000000000606', email: 'hema.demo@sih26024.test', name: 'Hema' }
];

async function setupNamedAuth() {
  console.log("Configuring 6 named SIH team demo accounts via Supabase Admin API...");
  for (const u of NAMED_DEMO_USERS) {
    const { data, error } = await adminClient.auth.admin.updateUserById(u.id, {
      password: 'demo123',
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });
    if (error) {
      console.error(`Error updating user ${u.name} (${u.email}):`, error.message);
    } else {
      console.log(`✓ Configured credentials for ${u.name} (${u.email}) [Confirmed: ${!!data.user.email_confirmed_at}]`);
    }
  }
}

setupNamedAuth().catch(err => {
  console.error("Setup error:", err);
  process.exit(1);
});
