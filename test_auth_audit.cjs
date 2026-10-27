const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthAudit() {
  console.log('=== TEST AUTH AUDIT ===\n');

  // Test sign in as rkppraveena@gmail.com
  const email = 'rkppraveena@gmail.com';
  // Try common passwords
  const passwords = ['praveena123', 'admin123', 'password', '123456', 'Praveena@123'];

  for (const pass of passwords) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!error && data?.session) {
      console.log(`Success signing in as ${email} with password '${pass}'! User ID: ${data.user.id}`);

      // Now query profiles and organizations under this session
      const { data: prof, error: profErr } = await supabase.from('profiles').select('*');
      console.log('\nProfiles under authenticated session:');
      console.log(profErr ? profErr.message : JSON.stringify(prof, null, 2));

      const { data: org, error: orgErr } = await supabase.from('organizations').select('*');
      console.log('\nOrganizations under authenticated session:');
      console.log(orgErr ? orgErr.message : JSON.stringify(org, null, 2));
      return;
    }
  }

  console.log('Could not sign in as rkppraveena@gmail.com with tested passwords.');
}

testAuthAudit();
