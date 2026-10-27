const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaxpabuuyffinfacmtty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHBhYnV1eWZmaW5mYWNtdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzA2MjcsImV4cCI6MjEwNjQ0NjYyN30.ACbXC7XtDu0idLGko0QSA4EsqMl3LvbtFuif3m_s6Xw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPlayTestAccounts() {
  console.log('=== CREATING DEDICATED GOOGLE PLAY TEST ACCOUNTS ===\n');

  const testPass = 'PlayTest@2026';

  const accounts = [
    {
      role: 'Individual User',
      email: 'playtest.individual@subshare.app',
      name: 'Google Play Reviewer (Individual)',
      accountType: 'individual',
      isAdmin: false,
    },
    {
      role: 'Verified NGO',
      email: 'playtest.ngo@subshare.app',
      name: 'Google Play Reviewer (NGO)',
      accountType: 'organization',
      isAdmin: false,
    },
    {
      role: 'Administrator',
      email: 'playtest.admin@subshare.app',
      name: 'Google Play Reviewer (Admin)',
      accountType: 'individual',
      isAdmin: true,
    },
  ];

  for (const acc of accounts) {
    console.log(`Setting up ${acc.role} (${acc.email})...`);

    let userId = null;

    // 1. Try signing in
    const signInRes = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: testPass,
    });

    if (signInRes.data?.session) {
      userId = signInRes.data.user.id;
      console.log(`  Already signed in! User ID: ${userId}`);
    } else {
      // 2. Sign up
      const signUpRes = await supabase.auth.signUp({
        email: acc.email,
        password: testPass,
        options: {
          data: { full_name: acc.name },
        },
      });

      if (signUpRes.data?.user) {
        userId = signUpRes.data.user.id;
        console.log(`  Created Auth user with ID: ${userId}`);
      } else {
        console.log(`  SignUp note: ${signUpRes.error?.message}`);
      }
    }

    if (userId) {
      // 3. Upsert Profile
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
        trust_score: 95,
        updated_at: new Date().toISOString(),
      });

      if (profErr) {
        console.log(`  Profile upsert note: ${profErr.message}`);
      } else {
        console.log(`  Profile set up: is_admin=${acc.isAdmin}, account_type=${acc.accountType}`);
      }

      // 4. If NGO, create verified Organization record
      if (acc.accountType === 'organization') {
        const { error: orgErr } = await supabase.from('organizations').upsert({
          user_id: userId,
          name: 'Play Review Aid Org',
          type: 'NGO',
          registration_number: 'REG-GOOGLE-PLAY-2026',
          contact_person: 'Review Partner',
          official_email: acc.email,
          official_phone: '+1 650 253 0000',
          city: 'California',
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        });

        if (orgErr) {
          console.log(`  Org upsert note: ${orgErr.message}`);
        } else {
          console.log(`  Verified Organization 'Play Review Aid Org' linked`);
        }
      }
    }
  }

  console.log('\n--- VERIFYING PLAY TEST ACCOUNTS LOGINS ---');
  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: testPass,
    });

    if (!error && data?.session) {
      console.log(`✅ VERIFIED LOGIN: ${acc.role} (${acc.email}) -> Password: '${testPass}'`);
    } else {
      console.log(`❌ FAILED LOGIN: ${acc.role} (${acc.email}): ${error?.message}`);
    }
  }
}

createPlayTestAccounts();
