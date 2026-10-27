const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runHealthCheck() {
  console.log('=== PART 1: DATABASE HEALTH CHECK ===\n');

  // Query 1: Row counts
  const tables = [
    'blood_requests',
    'chat_messages',
    'chat_rooms',
    'food_donations',
    'notifications',
    'organizations',
    'profiles',
    'reports',
    'rides',
    'service_requests',
    'subscription_groups',
    'tickets',
    'user_queries'
  ];

  console.log('--- QUERY 1: ROW COUNTS ---');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`${table}: ERROR (${error.message})`);
      } else {
        console.log(`${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`${table}: Exception (${e.message})`);
    }
  }

  // Query 2: Fetch active rows per service table to inspect schema
  console.log('\n--- QUERY 2: SERVICE TABLES CONTENT ---');
  const serviceTables = ['tickets', 'rides', 'blood_requests', 'food_donations', 'subscription_groups', 'service_requests', 'chat_rooms', 'chat_messages', 'notifications'];
  for (const table of serviceTables) {
    const { data, error } = await supabase.from(table).select('*').limit(3);
    if (error) {
      console.log(`${table}: SELECT Error (${error.message})`);
    } else {
      console.log(`${table}: ${data.length} sample rows`);
    }
  }

  // Query 3: Profiles
  console.log('\n--- QUERY 3: PROFILES LIST ---');
  const { data: profs, error: profErr } = await supabase.from('profiles').select('id, email, name, account_type, is_admin');
  if (profErr) {
    console.log('Profiles query error:', profErr.message);
  } else {
    console.log(JSON.stringify(profs, null, 2));
  }

  // Query 4: Organizations
  console.log('\n--- QUERY 4: ORGANIZATIONS LIST ---');
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id, name, type, verification_status, user_id, created_at');
  if (orgErr) {
    console.log('Orgs query error:', orgErr.message);
  } else {
    console.log(JSON.stringify(orgs, null, 2));
  }
}

runHealthCheck();
