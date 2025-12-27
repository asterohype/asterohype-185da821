
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY; // Using Anon key for simulation

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- DIAGNOSING PRODUCT TAGS ---');
  console.log('Checking connection to:', supabaseUrl);

  // 1. Check if we can read tags (public)
  const { data: tags, error: tagsError } = await supabase.from('product_tags').select('*').limit(5);
  if (tagsError) {
    console.error('❌ Error reading tags:', tagsError.message);
  } else {
    console.log('✅ Read tags success. Count:', tags.length);
  }

  // 2. Check assignments
  const { data: assignments, error: assignError } = await supabase.from('product_tag_assignments').select('*').limit(5);
  if (assignError) {
    console.error('❌ Error reading assignments:', assignError.message);
  } else {
    console.log('✅ Read assignments success. Count:', assignments.length);
    if (assignments.length > 0) {
        console.log('Sample assignment:', assignments[0]);
    }
  }

  // 3. NOTE: We cannot check Admin permissions easily here because we are "Anon".
  // The user in the browser has a session.
  // This script just confirms the TABLE is accessible publicly for reading.

  console.log('--- DONE ---');
}

test();
