import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkProfiles() {
  try {
    const { data, error: usersError } = await supabase.auth.admin.listUsers();
    console.log("Auth Users:", data?.users?.map(u => ({ id: u.id, email: u.email, meta: u.user_metadata })));
    
    const { data: profiles, error: profError } = await supabase.from('user_profiles').select('*');
    console.log("Profiles:", profiles);
    console.log("Profiles Error:", profError);

  } catch (err) {
    console.log("Error:", err);
  }
}

checkProfiles();
