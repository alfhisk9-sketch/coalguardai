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
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const ACCOUNTS = [
  { name: 'Alfhi', role: 'SUPER_ADMIN', email: 'alfhi.demo@sih26024.test', expectedMines: 4 },
  { name: 'Rabbani', role: 'CORPORATE_ADMIN', email: 'rabbani.demo@sih26024.test', expectedMines: 4 },
  { name: 'Akshay', role: 'MINE_MANAGER', email: 'akshay.demo@sih26024.test', expectedMines: 1 },
  { name: 'Krishna', role: 'INSPECTOR', email: 'krishna.demo@sih26024.test', expectedMines: 1 },
  { name: 'Koushik', role: 'CONTRACTOR', email: 'koushik.demo@sih26024.test', expectedMines: 0, expectedContractors: 1 },
  { name: 'Hema', role: 'REGULATOR', email: 'hema.demo@sih26024.test', expectedMines: 1 }
];

async function verifyNamedAccounts() {
  console.log("Verifying 6 named SIH team demo accounts on Live Supabase...");
  for (const acct of ACCOUNTS) {
    const client = createClient(supabaseUrl, anonKey);
    const { data: signIn, error: signErr } = await client.auth.signInWithPassword({
      email: acct.email,
      password: 'demo123'
    });

    if (signErr) {
      console.error(`✗ Sign-in FAILED for ${acct.name}:`, signErr.message);
      process.exit(1);
    }

    const { data: profile } = await client.from('profiles').select('full_name, email, contractor_id').eq('id', signIn.user.id).single();
    const { data: roles } = await client.from('user_roles').select('role_id, mine_id, roles(key)').eq('user_id', signIn.user.id);
    const roleKey = roles?.[0]?.roles?.key;

    const { data: mines } = await client.from('mines').select('id, code, name');
    console.log(`✓ [${acct.name}] ${acct.email}:`);
    console.log(`    Auth ID: ${signIn.user.id}`);
    console.log(`    Profile Name: ${profile?.full_name} | Role: ${roleKey}`);
    console.log(`    RLS Visible Mines: ${mines?.length ?? 0} (${(mines || []).map(m => m.code).join(', ')})`);

    if (acct.role === 'CONTRACTOR') {
      const { data: contractors } = await client.from('contractors').select('id, company_name');
      console.log(`    RLS Visible Contractors: ${contractors?.length ?? 0} (${(contractors || []).map(c => c.company_name).join(', ')})`);
    }
  }
}

verifyNamedAccounts().catch(err => {
  console.error(err);
  process.exit(1);
});
