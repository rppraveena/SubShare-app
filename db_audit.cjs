const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log('=== DATABASE AUDIT RESULTS ===\n');

  // Step 2.1 & 2.2: Row counts per table
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

  console.log('Step 2.1 & 2.2: Tables & Row Counts:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`Table '${table}': ERROR / Missing (${error.message})`);
      } else {
        console.log(`Table '${table}': ${count} rows`);
      }
    } catch (e) {
      console.log(`Table '${table}': Exception (${e.message})`);
    }
  }

  // Step 2.3: Check if Nat NGO exists
  console.log('\nStep 2.3: Organizations List (Checking for Nat NGO):');
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

  // Step 2.4: Check for null verification_status
  console.log('\nStep 2.4: Check for null verification_status:');
  try {
    const { count: nullCount, error: nullErr } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .is('verification_status', null);

    if (nullErr) {
      console.log('Error checking null status:', nullErr.message);
    } else {
      console.log(`Organizations with null verification_status: ${nullCount}`);
    }
  } catch (e) {
    console.log('Exception checking null status:', e.message);
  }
}

runAudit();
