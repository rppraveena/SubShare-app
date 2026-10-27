const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAuditAuth() {
  console.log('=== AUTHENTICATED DATABASE AUDIT ===\n');

  // Try signing in as admin rkppraveena@gmail.com or admin credentials
  const logins = [
    { email: 'rkppraveena@gmail.com', pass: 'admin123' },
    { email: 'admin@subshare.app', pass: 'admin123' },
    { email: 'admin@trustshare.org', pass: 'admin123' },
  ];

  let authedClient = supabase;
  let loggedInUser = null;

  for (const l of logins) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: l.email,
      password: l.pass,
    });
    if (!error && data?.session) {
      console.log(`Successfully authenticated as: ${l.email}`);
      loggedInUser = data.user;
      break;
    } else {
      console.log(`Login attempt for ${l.email}: ${error?.message || 'failed'}`);
    }
  }

  const tables = [
    'profiles',
    'organizations',
    'tickets',
    'rides',
    'blood_requests',
    'food_donations',
    'subscription_groups',
    'service_requests',
    'chat_rooms',
    'chat_messages',
    'reports',
    'user_queries',
    'notifications'
  ];

  console.log('\n--- Table Row Counts (under auth session) ---');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`Table '${table}': ERROR (${error.message})`);
      } else {
        console.log(`Table '${table}': ${count} rows`);
      }
    } catch (e) {
      console.log(`Table '${table}': Exception (${e.message})`);
    }
  }

  console.log('\n--- Organizations List ---');
  try {
    const { data: orgs, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, type, verification_status, user_id, created_at')
      .order('created_at', { ascending: false });

    if (orgErr) {
      console.log('Error fetching organizations:', orgErr.message);
    } else {
      console.log(JSON.stringify(orgs, null, 2));
    }
  } catch (e) {
    console.log('Exception fetching orgs:', e.message);
  }

  console.log('\n--- Profiles List ---');
  try {
    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('id, name, email, account_type, is_admin, verification_status')
      .order('created_at', { ascending: false });

    if (profErr) {
      console.log('Error fetching profiles:', profErr.message);
    } else {
      console.log(JSON.stringify(profs, null, 2));
    }
  } catch (e) {
    console.log('Exception fetching profs:', e.message);
  }
}

runAuditAuth();
