const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupPlayAccounts() {
  console.log('=== SETTING UP PLAY CONSOLE TEST ACCOUNTS ===\n');

  const testPassword = 'Subshare@2026';

  const accounts = [
    {
      role: 'Individual User',
      email: 'praveena.cs23@krct.ac.in',
      name: 'Praveena Individual',
      accountType: 'individual',
      isAdmin: false,
    },
    {
      role: 'NGO Partner',
      email: 'rpraveena1110@gmail.com',
      name: 'Nat NGO Partner',
      accountType: 'organization',
      isAdmin: false,
    },
    {
      role: 'Administrator',
      email: 'rkppraveena@gmail.com',
      name: 'SubShare Admin',
      accountType: 'individual',
      isAdmin: true,
    },
  ];

  for (const acc of accounts) {
    console.log(`Processing ${acc.role} (${acc.email})...`);

    // 1. Try signing in
    const signInRes = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: testPassword,
    });

    let userId = signInRes.data?.user?.id;

    if (signInRes.error) {
      // 2. Try signing up
      const signUpRes = await supabase.auth.signUp({
        email: acc.email,
        password: testPassword,
        options: {
          data: { full_name: acc.name },
        },
      });

      if (signUpRes.error) {
        console.log(`  Signup note: ${signUpRes.error.message}`);
      } else if (signUpRes.data?.user) {
        userId = signUpRes.data.user.id;
        console.log(`  Created Auth user with ID: ${userId}`);
      }
    } else {
      console.log(`  Auth user exists with ID: ${userId}`);
    }

    // 3. Update or Upsert profile in Supabase database
    if (userId) {
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: userId,
        name: acc.name,
        email: acc.email,
        account_type: acc.accountType,
        is_admin: acc.isAdmin,
        email_verified: true,
        phone_verified: true,
        verification_status: 'verified',
        profile_completed: true,
        trust_score: 85,
        updated_at: new Date().toISOString(),
      });

      if (profErr) {
        console.log(`  Profile upsert note: ${profErr.message}`);
      } else {
        console.log(`  Profile created/updated with is_admin=${acc.isAdmin}, account_type=${acc.accountType}`);
      }

      // 4. If NGO account, ensure organization record exists with verified status
      if (acc.accountType === 'organization') {
        const { error: orgErr } = await supabase.from('organizations').upsert({
          user_id: userId,
          name: 'Nat NGO',
          type: 'NGO',
          registration_number: 'REG-7393JWI29',
          contact_person: 'Praveena R',
          official_email: acc.email,
          official_phone: '+91 9876543210',
          city: 'Trichy',
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        });

        if (orgErr) {
          console.log(`  Org record note: ${orgErr.message}`);
        } else {
          console.log(`  Organization record verified for Nat NGO`);
        }
      }
    }
  }

  console.log('\n--- VERIFYING ALL 3 ACCOUNTS AGAIN ---');
  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: testPassword,
    });

    if (!error && data?.session) {
      console.log(`✅ VERIFIED: ${acc.role} (${acc.email}) password: '${testPassword}' - READY FOR GOOGLE PLAY REVIEW!`);
    } else {
      console.log(`❌ UNVERIFIED: ${acc.role} (${acc.email}): ${error?.message}`);
    }
  }
}

setupPlayAccounts();
