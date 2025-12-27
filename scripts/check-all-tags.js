
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hwezwdzxnvbwnjkrwucw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZXp3ZHp4bnZid25qa3J3dWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzIzNzMsImV4cCI6MjA4MTIwODM3M30.bQBcQkaMIIjSfYDDZOLTWlojXAxpM1rxerEYMRTlQ0w";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTags() {
  console.log('--- CHECKING ALL TAGS ---');
  
  const { data: tags, error } = await supabase
    .from('product_tags')
    .select('*')
    .order('group_name');

  if (error) {
    console.error('Error fetching tags:', error);
    return;
  }

  console.log('Total tags found:', tags.length);
  console.table(tags.map(t => ({ name: t.name, slug: t.slug, group: t.group_name, id: t.id })));
}

checkAllTags();
