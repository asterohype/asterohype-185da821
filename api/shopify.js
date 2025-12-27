import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Authentication Check (Supabase)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Hardcoded credentials to ensure availability in Vercel runtime without manual env config
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hwezwdzxnvbwnjkrwucw.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    // Fallback: Check for specific admin email hardcoded in case DB check fails
    // This mirrors the logic requested by the user to avoid "session expired" issues if possible
    console.error("Auth error:", authError);
    return res.status(401).json({ error: 'Invalid token or session expired' });
  }

  // 2. Admin Check
  const allowedEmails = ['asterohype@gmail.com', 'neomaffofficial@gmail.com', 'miriamlamejor@gmail.com'];
  if (!allowedEmails.includes(user.email)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // 3. Shopify Proxy Logic
  const { action, productId, title, description, price, variantId, imageId, imageUrl, altText, tags } = req.body;
  
  const SHOPIFY_ADMIN_API_URL = 'https://e7kzti-96.myshopify.com/admin/api/2025-01';
  // Note: In Vercel, env vars are process.env.X
  // We need to ensure SHOPIFY_ACCESS_TOKEN is set in Vercel project settings
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; 

  let url = '';
  let method = '';
  let body = {};

  try {
    const numericProductId = productId ? String(productId).replace("gid://shopify/Product/", "") : null;

    switch (action) {
      case 'update_title':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}.json`;
        method = 'PUT';
        body = { product: { id: numericProductId, title } };
        break;
      
      case 'update_description':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}.json`;
        method = 'PUT';
        body = { product: { id: numericProductId, body_html: description } };
        break;

      case 'update_tags':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}.json`;
        method = 'PUT';
        body = { product: { id: numericProductId, tags: tags } };
        break;
      
      case 'update_options':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}.json`;
        method = 'PUT';
        body = { product: { id: numericProductId, options: payload.options } };
        break;

      case 'update_variant_price':
        const numericVariantId = String(variantId).replace("gid://shopify/ProductVariant/", "");
        url = `${SHOPIFY_ADMIN_API_URL}/variants/${numericVariantId}.json`;
        method = 'PUT';
        body = { variant: { id: numericVariantId, price } };
        break;

      case 'update_variant':
        const numVarId = String(variantId).replace("gid://shopify/ProductVariant/", "");
        url = `${SHOPIFY_ADMIN_API_URL}/variants/${numVarId}.json`;
        method = 'PUT';
        body = { variant: { id: numVarId, ...payload.updates } };
        break;
      
      case 'delete_product':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}.json`;
        method = 'DELETE';
        break;
        
      case 'delete_product_image':
        const numericImageId = String(imageId).replace("gid://shopify/ProductImage/", "");
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}/images/${numericImageId}.json`;
        method = 'DELETE';
        break;
        
      case 'add_product_image':
        url = `${SHOPIFY_ADMIN_API_URL}/products/${numericProductId}/images.json`;
        method = 'POST';
        body = { image: { src: imageUrl, alt: altText } };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const shopifyRes = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: method !== 'DELETE' ? JSON.stringify(body) : undefined
    });

    if (!shopifyRes.ok) {
      const errorText = await shopifyRes.text();
      console.error('Shopify API Error:', errorText);
      return res.status(shopifyRes.status).json({ error: `Shopify Error: ${errorText}` });
    }

    const data = await shopifyRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
