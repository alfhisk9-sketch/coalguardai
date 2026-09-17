const http = require('http');
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
const projectRef = 'gsucaridjlhrpitrxynj';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testAuthApi() {
  console.log("Testing Live Authenticated API Calls via Next.js...");

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'manager.shakti.demo@sih26024.test',
    password: 'CoalGuard@2026'
  });

  if (error) {
    console.error("Sign in failed:", error.message);
    process.exit(1);
  }

  const session = data.session;
  // Format cookie as expected by @supabase/ssr
  const sessionData = JSON.stringify([session.access_token, session.refresh_token]);
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieHeader = `${cookieName}=${encodeURIComponent(sessionData)}`;

  const res = await fetchUrl('http://localhost:3000/api/mines', {
    method: 'GET',
    headers: {
      'Cookie': cookieHeader
    }
  });

  console.log(`API response status: ${res.statusCode}`);
  console.log(`API response body: ${res.body}`);
}

testAuthApi().catch(console.error);
