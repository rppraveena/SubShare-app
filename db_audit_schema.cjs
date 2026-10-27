const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('=== SCHEMA & RECORD INSPECTION ===\n');

  console.log('--- Fetching Profiles without created_at ordering ---');
  try {
    const { data: profs, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.log('Error fetching profiles:', error.message);
    } else {
      console.log(`Profiles count: ${profs.length}`);
      console.log(JSON.stringify(profs, null, 2));
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n--- Fetching Organizations ---');
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*');

    if (error) {
      console.log('Error fetching organizations:', error.message);
    } else {
      console.log(`Organizations count: ${orgs.length}`);
      console.log(JSON.stringify(orgs, null, 2));
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n--- Fetching Tickets ---');
  try {
    const { data: t, error } = await supabase
      .from('tickets')
      .select('*');

    if (error) {
      console.log('Error fetching tickets:', error.message);
    } else {
      console.log(`Tickets count: ${t.length}`);
      console.log(JSON.stringify(t, null, 2));
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }
}

inspectSchema();
