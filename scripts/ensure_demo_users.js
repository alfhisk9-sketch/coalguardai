const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PERSONAS = [
  {
    email: 'alfhi.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Alfhi (Super Admin)',
    roleKey: 'SUPER_ADMIN',
    mineId: null,
  },
  {
    email: 'rabbani.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Rabbani (Corporate Admin)',
    roleKey: 'CORPORATE_ADMIN',
    mineId: null,
  },
  {
    email: 'akshay.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Akshay (Mine Manager)',
    roleKey: 'MINE_MANAGER',
    mineId: 'a0000000-0000-0000-0000-000000000030', // Shakti Open Cast Mine
  },
  {
    email: 'krishna.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Krishna (Inspector)',
    roleKey: 'INSPECTOR',
    mineId: 'a0000000-0000-0000-0000-000000000030',
  },
  {
    email: 'hema.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Hema (Safety Officer / Regulator)',
    roleKey: 'REGULATOR',
    mineId: 'a0000000-0000-0000-0000-000000000030',
  },
  {
    email: 'koushik.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Koushik (Contractor)',
    roleKey: 'CONTRACTOR',
    mineId: null,
    contractorId: 'a0000000-0000-0000-0000-000000000110',
  },
  // Also support canonical role-based demo accounts
  {
    email: 'admin.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Administrator Demo',
    roleKey: 'SUPER_ADMIN',
    mineId: null,
  },
  {
    email: 'manager.shakti.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Mine Manager Demo (Shakti)',
    roleKey: 'MINE_MANAGER',
    mineId: 'a0000000-0000-0000-0000-000000000030',
  },
  {
    email: 'inspector.shakti.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Inspector Demo (Shakti)',
    roleKey: 'INSPECTOR',
    mineId: 'a0000000-0000-0000-0000-000000000030',
  },
  {
    email: 'regulator.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Safety Officer / Regulator Demo',
    roleKey: 'REGULATOR',
    mineId: 'a0000000-0000-0000-0000-000000000030',
  },
  {
    email: 'contractor.alpha.demo@sih26024.test',
    password: 'demo123',
    fullName: 'Contractor Demo (Alpha)',
    roleKey: 'CONTRACTOR',
    mineId: null,
    contractorId: 'a0000000-0000-0000-0000-000000000110',
  }
];

async function ensureDemoUsers() {
  console.log('Ensuring all demo users exist, have confirmed emails, and valid credentials...');

  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('Failed to list users:', listErr.message);
    process.exit(1);
  }

  const { data: roles } = await supabase.from('roles').select('id, key');
  const roleMap = new Map((roles || []).map(r => [r.key, r.id]));

  for (const persona of DEMO_PERSONAS) {
    let existingUser = users.find(u => u.email?.toLowerCase() === persona.email.toLowerCase());
    let userId;

    if (!existingUser) {
      console.log(`Creating demo user in auth: ${persona.email}`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: persona.email,
        password: persona.password,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName }
      });
      if (createErr) {
        console.error(`Error creating ${persona.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
    } else {
      userId = existingUser.id;
      // Ensure confirmed and password matches demo123
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: persona.password,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName }
      });
      if (updateErr) {
        console.warn(`Could not update ${persona.email}:`, updateErr.message);
      }
    }

    // Ensure profiles record
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: persona.fullName,
      email: persona.email,
      contractor_id: persona.contractorId || null,
      is_active: true
    }, { onConflict: 'id' });

    // Ensure user_roles record
    const roleId = roleMap.get(persona.roleKey);
    if (roleId) {
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (!existingRoles || existingRoles.length === 0) {
        await supabase.from('user_roles').insert({
          user_id: userId,
          role_id: roleId,
          mine_id: persona.mineId || null
        });
      }
    }
  }

  console.log('✓ All demo accounts verified in Supabase Auth, profiles, and user_roles.');
}

ensureDemoUsers().catch(console.error);
