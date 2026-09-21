const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('apps/web/.env.local'));

const PERSONAS = [
  { name: 'Alfhi', role: 'SUPER_ADMIN', email: 'alfhi.demo@sih26024.test' },
  { name: 'Rabbani', role: 'CORPORATE_ADMIN', email: 'rabbani.demo@sih26024.test' },
  { name: 'Akshay', role: 'MINE_MANAGER', email: 'akshay.demo@sih26024.test' },
  { name: 'Krishna', role: 'INSPECTOR', email: 'krishna.demo@sih26024.test' },
  { name: 'Hema', role: 'REGULATOR', email: 'hema.demo@sih26024.test' },
  { name: 'Koushik', role: 'CONTRACTOR', email: 'koushik.demo@sih26024.test' }
];

async function main() {
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('=== VERIFYING ALL DEMO PERSONAS ===');

  for (const p of PERSONAS) {
    const userClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: auth, error: authErr } = await userClient.auth.signInWithPassword({
      email: p.email,
      password: 'demo123'
    });

    if (authErr) {
      console.error('FAIL on sign in:', p.name, authErr.message);
      continue;
    }

    const { data: profile } = await adminClient.from('profiles').select('*').eq('id', auth.user.id).single();
    const { data: userRoles } = await adminClient.from('user_roles').select('*, roles(*)').eq('user_id', auth.user.id);
    const roleKey = userRoles?.[0]?.roles?.key;

    // Simulate listMinesForUser
    const orgWide = roleKey === 'SUPER_ADMIN' || roleKey === 'CORPORATE_ADMIN';
    let mineIds = (userRoles || []).map(r => r.mine_id).filter(Boolean);

    if (roleKey === 'CONTRACTOR' && profile?.contractor_id) {
      const { data: contractor } = await adminClient.from('contractors').select('mine_id').eq('id', profile.contractor_id).single();
      if (contractor?.mine_id && !mineIds.includes(contractor.mine_id)) {
        mineIds.push(contractor.mine_id);
      }
    }

    let mines = [];
    if (orgWide) {
      const { data: allMines } = await adminClient.from('mines').select('id, code, name');
      mines = allMines || [];
    } else if (mineIds.length > 0) {
      const { data: scopedMines } = await adminClient.from('mines').select('id, code, name').in('id', mineIds);
      mines = scopedMines || [];
    }

    console.log(`[PASS] ${p.name} (${roleKey}): Profile = ${profile?.full_name}, Authorized Mines = ${mines.length} (${mines.map(m => m.code).join(', ')})`);
  }

  // Also verify Sk Alfhi
  const { data: skProfile } = await adminClient.from('profiles').select('*').eq('email', 'alfhisk9@gmail.com').single();
  const { data: skRoles } = await adminClient.from('user_roles').select('*, roles(*)').eq('user_id', skProfile?.id);
  console.log(`[PASS] Sk Alfhi: Profile = ${skProfile?.full_name}, Role = ${skRoles?.[0]?.roles?.key} (${skRoles?.[0]?.roles?.name}), Mine Scope = ${skRoles?.[0]?.mine_id ? 'SHK-DEMO' : 'none'}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
