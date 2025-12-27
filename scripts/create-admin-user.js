
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hwezwdzxnvbwnjkrwucw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZXp3ZHp4bnZid25qa3J3dWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzIzNzMsImV4cCI6MjA4MTIwODM3M30.bQBcQkaMIIjSfYDDZOLTWlojXAxpM1rxerEYMRTlQ0w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
  const email = 'sixfled02@gmail.com';
  const password = 'eLrAYanchuLO221978siXFLED';

  console.log(`Signing up user ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: 'Admin User'
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('Sign up successful (or confirmation sent).');
    if (data.user) {
        console.log('User ID:', data.user.id);
    }
  }
}

createAdmin();
