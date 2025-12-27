
import { createClient } from '@supabase/supabase-js';
// import fetch from 'node-fetch'; // Built-in in Node 22

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Shopify Credentials (from Edge Function)
const SHOPIFY_STORE_DOMAIN = "e7kzti-96.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreTags() {
  console.log('Fetching tags from Supabase...');
  
  const { data: assignments, error } = await supabase
    .from('product_tag_assignments')
    .select(`
      shopify_product_id,
      tag:product_tags (
        name
      )
    `);

  if (error) {
    console.error('Error fetching assignments:', error);
    return;
  }

  // Group by Product ID
  const tagsByProduct = {};
  assignments.forEach(item => {
    const pid = item.shopify_product_id;
    if (!tagsByProduct[pid]) {
      tagsByProduct[pid] = new Set();
    }
    if (item.tag?.name) {
      tagsByProduct[pid].add(item.tag.name);
    }
  });

  const productIds = Object.keys(tagsByProduct);
  console.log(`Found ${assignments.length} assignments for ${productIds.length} products.`);

  // Process each product
  for (const [index, productId] of productIds.entries()) {
    const dbTags = Array.from(tagsByProduct[productId]);
    const numericId = productId.replace('gid://shopify/Product/', '');
    
    console.log(`[${index + 1}/${productIds.length}] Processing ${numericId}...`);

    try {
      // 1. Get current Shopify tags to preserve them
      const getResponse = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products/${numericId}.json`, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        console.error(`Failed to fetch product ${numericId}: ${getResponse.statusText}`);
        continue;
      }

      const productData = await getResponse.json();
      const currentTagsStr = productData.product.tags || "";
      const currentTags = currentTagsStr.split(',').map(t => t.trim()).filter(Boolean);

      // 2. Merge tags
      const mergedTags = new Set([...currentTags, ...dbTags]);
      const finalTags = Array.from(mergedTags).join(',');

      if (finalTags === currentTagsStr) {
        console.log(`  -> No changes needed.`);
        continue;
      }

      // 3. Update Shopify
      const updateResponse = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products/${numericId}.json`, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product: {
            id: numericId,
            tags: finalTags
          }
        })
      });

      if (updateResponse.ok) {
        console.log(`  -> Updated successfully. Tags: ${finalTags}`);
      } else {
        console.error(`  -> Failed to update: ${updateResponse.statusText}`);
      }

      // Brief pause to respect rate limits
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error(`  -> Error processing ${numericId}:`, err);
    }
  }
  
  console.log('Restoration complete!');
}

restoreTags();
