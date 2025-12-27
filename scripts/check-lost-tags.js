
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
  console.log('Checking product_tag_assignments...');
  
  const { data, error, count } = await supabase
    .from('product_tag_assignments')
    .select(`
      shopify_product_id,
      tag:product_tags (
        name,
        group_name
      )
    `, { count: 'exact' });

  if (error) {
    console.error('Error fetching assignments:', error);
    return;
  }

  console.log(`Found ${count} total tag assignments in database.`);
  
  if (data && data.length > 0) {
    console.log('Sample data (first 5):');
    data.slice(0, 5).forEach(item => {
      console.log(`- Product ID: ${item.shopify_product_id} -> Tag: ${item.tag?.name} (${item.tag?.group_name})`);
    });
    
    // Group by product to see how many tags per product
    const tagsByProduct = {};
    data.forEach(item => {
      if (!tagsByProduct[item.shopify_product_id]) {
        tagsByProduct[item.shopify_product_id] = [];
      }
      if (item.tag?.name) {
        tagsByProduct[item.shopify_product_id].push(item.tag.name);
      }
    });
    
    console.log('\nSummary by Product (first 3 products):');
    Object.keys(tagsByProduct).slice(0, 3).forEach(pid => {
      console.log(`Product ${pid}: [${tagsByProduct[pid].join(', ')}]`);
    });
  } else {
    console.log('No tag assignments found in the database.');
  }
}

checkTags();
