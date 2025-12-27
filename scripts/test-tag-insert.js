
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTagAssignment() {
  const productId = 'gid://shopify/Product/10634058137946'; // Un producto que sabemos que existe
  const tagId = '00dee0aa-b167-461f-9a74-7cebb8f5e757'; // Etiqueta "Destacado"

  console.log(`Testing assignment for Product: ${productId}, Tag: ${tagId}`);

  // 1. Check if already exists
  const { data: existing } = await supabase
    .from('product_tag_assignments')
    .select('*')
    .eq('shopify_product_id', productId)
    .eq('tag_id', tagId);

  if (existing && existing.length > 0) {
    console.log('Assignment already exists. Deleting first...');
    const { error: delError } = await supabase
      .from('product_tag_assignments')
      .delete()
      .eq('shopify_product_id', productId)
      .eq('tag_id', tagId);
    
    if (delError) {
      console.error('Error deleting existing:', delError);
      return;
    }
    console.log('Deleted existing assignment.');
  }

  // 2. Try Insert
  console.log('Attempting INSERT...');
  const { data: inserted, error: insertError } = await supabase
    .from('product_tag_assignments')
    .insert({ shopify_product_id: productId, tag_id: tagId })
    .select();

  if (insertError) {
    console.error('INSERT ERROR:', insertError);
    // Check RLS policies if error is related to permissions
    if (insertError.code === '42501') {
        console.error('RLS PERMISSION DENIED. Check Row Level Security policies.');
    }
  } else {
    console.log('INSERT SUCCESS:', inserted);
  }
}

testTagAssignment();
