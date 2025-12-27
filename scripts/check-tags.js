
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for now, hoping RLS allows read

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTags() {
  const { data: tags, error } = await supabase
    .from('product_tags')
    .select('*');

  if (error) {
    console.error('Error fetching tags:', error);
    return;
  }

  console.log('Total tags:', tags.length);
  const destacados = tags.filter(t => t.group_name === 'Destacados');
  console.log('Destacados tags:', destacados.map(t => ({ id: t.id, name: t.name })));
  
  if (destacados.length === 0) {
      console.log('No tags found in "Destacados" group.');
  }
}

checkTags();
