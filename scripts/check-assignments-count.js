
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hwezwdzxnvbwnjkrwucw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZXp3ZHp4bnZid25qa3J3dWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzIzNzMsImV4cCI6MjA4MTIwODM3M30.bQBcQkaMIIjSfYDDZOLTWlojXAxpM1rxerEYMRTlQ0w";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotalAssignments() {
  console.log('--- CHECKING TOTAL ASSIGNMENTS ---');
  
  const { count, error } = await supabase
    .from('product_tag_assignments')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting assignments:', error);
    return;
  }

  console.log('Total assignments count:', count);
  
  if (count > 900) {
      console.warn('⚠️ WARNING: Assignment count is approaching 1000 (Supabase default limit)');
  }
}

checkTotalAssignments();
