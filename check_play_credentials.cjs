const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCredentials() {
  console.log('=== PLAY CONSOLE TEST ACCOUNTS CHECK ===\n');

  const accounts = [
    { label: 'Individual', email: 'praveena.cs23@krct.ac.in', pass: 'Praveena@123' },
    { label: 'NGO', email: 'rpraveena1110@gmail.com', pass: 'Praveena@123' },
    { label: 'Admin', email: 'rkppraveena@gmail.com', pass: 'Praveena@123' },
    { label: 'Admin Alt', email: 'rkppraveena@gmail.com', pass: 'admin123' },
  ];

  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });

    if (!error && data?.session) {
      console.log(`✅ SUCCESS: ${acc.label} (${acc.email}) logged in successfully with password '${acc.pass}'!`);
    } else {
      console.log(`❌ FAILED: ${acc.label} (${acc.email}) with password '${acc.pass}': ${error?.message}`);
    }
  }
}

checkCredentials();
