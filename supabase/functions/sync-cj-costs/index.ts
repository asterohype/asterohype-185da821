import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CJProduct {
  productId: string;
  nameEn: string;
  sku: string;
  sellPrice: string;
  totalPrice: string;
  bigImage: string;
}

async function getCachedToken(supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('cj_token_cache')
    .select('access_token, expires_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || new Date(data.expires_at) <= new Date()) {
    return null;
  }
  return data.access_token;
}

async function getNewAccessToken(supabase: any, apiKey: string): Promise<string | null> {
  const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.code !== 200 || !tokenData.data?.accessToken) {
    return null;
  }

  const accessToken = tokenData.data.accessToken;
  const expiresAt = tokenData.data.accessTokenExpiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('cj_token_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cj_token_cache').insert({
    access_token: accessToken,
    refresh_token: tokenData.data.refreshToken || null,
    expires_at: expiresAt,
  });

  return accessToken;
}

async function getAccessToken(supabase: any, apiKey: string): Promise<string | null> {
  return await getCachedToken(supabase) || await getNewAccessToken(supabase, apiKey);
}

async function fetchAllCJProducts(accessToken: string): Promise<CJProduct[]> {
  const allProducts: CJProduct[] = [];
  let pageNum = 1;
  const pageSize = 200;
  let hasMore = true;

  while (hasMore) {
    const url = new URL('https://developers.cjdropshipping.com/api2.0/v1/product/myProduct/query');
    url.searchParams.set('pageNum', String(pageNum));
    url.searchParams.set('pageSize', String(pageSize));

    console.log(`Fetching CJ products page ${pageNum}...`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
    });

    const data = await response.json();
    
    if (data.code !== 200 || !data.data?.content) {
      console.error('CJ API error:', data.message);
      break;
    }

    const products = data.data.content.map((p: any) => ({
      productId: p.productId,
      nameEn: p.nameEn || '',
      sku: p.sku || '',
      sellPrice: p.sellPrice || '0',
      totalPrice: p.totalPrice || '0',
      bigImage: p.bigImage || '',
    }));

    allProducts.push(...products);

    if (products.length < pageSize || pageNum >= (data.data.totalPages || 1)) {
      hasMore = false;
    } else {
      pageNum++;
    }
  }

  console.log(`Total CJ products fetched: ${allProducts.length}`);
  return allProducts;
}

// Normalize product names for matching
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

    if (!CJ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse request body for Shopify products
    const { shopifyProducts } = await req.json();
    
    if (!shopifyProducts || !Array.isArray(shopifyProducts)) {
      return new Response(
        JSON.stringify({ success: false, error: 'shopifyProducts array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received ${shopifyProducts.length} Shopify products to sync`);

    // Get CJ access token
    const accessToken = await getAccessToken(supabase, CJ_API_KEY);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get CJ Access Token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all CJ products
    const cjProducts = await fetchAllCJProducts(accessToken);
    
    // Create a map for faster matching
    const cjByName = new Map<string, CJProduct>();
    const cjBySku = new Map<string, CJProduct>();
    
    for (const cj of cjProducts) {
      if (cj.nameEn) {
        cjByName.set(normalizeForMatch(cj.nameEn), cj);
      }
      if (cj.sku) {
        cjBySku.set(cj.sku.toLowerCase(), cj);
      }
    }

    const results: Array<{
      shopifyId: string;
      shopifyTitle: string;
      matched: boolean;
      cjProductId?: string;
      cjName?: string;
      productCost?: number;
      shippingCost?: number;
      updated: boolean;
    }> = [];

    // Match and sync each Shopify product
    for (const sp of shopifyProducts) {
      const shopifyId = sp.id.replace('gid://shopify/Product/', '');
      const normalizedTitle = normalizeForMatch(sp.title);
      
      // Try to find matching CJ product
      let matchedCJ: CJProduct | undefined;
      
      // First try exact name match
      matchedCJ = cjByName.get(normalizedTitle);
      
      // If no match, try partial matching
      if (!matchedCJ) {
        for (const [cjName, cj] of cjByName) {
          if (normalizedTitle.includes(cjName) || cjName.includes(normalizedTitle)) {
            matchedCJ = cj;
            break;
          }
        }
      }

      if (matchedCJ) {
        const sellPrice = parseFloat(matchedCJ.sellPrice) || 0;
        const totalPrice = parseFloat(matchedCJ.totalPrice) || 0;
        const shippingEstimate = Math.max(0, totalPrice - sellPrice);

        // Upsert to product_costs
        const { error: upsertError } = await supabase
          .from('product_costs')
          .upsert({
            shopify_product_id: shopifyId,
            cj_product_id: matchedCJ.productId,
            product_cost: sellPrice,
            shipping_cost: shippingEstimate,
            notes: JSON.stringify({
              cj_product_id: matchedCJ.productId,
              cj_name: matchedCJ.nameEn,
              cj_sku: matchedCJ.sku,
              synced_at: new Date().toISOString(),
            }),
          }, { onConflict: 'shopify_product_id' });

        results.push({
          shopifyId,
          shopifyTitle: sp.title,
          matched: true,
          cjProductId: matchedCJ.productId,
          cjName: matchedCJ.nameEn,
          productCost: sellPrice,
          shippingCost: shippingEstimate,
          updated: !upsertError,
        });

        if (upsertError) {
          console.error(`Error upserting ${shopifyId}:`, upsertError);
        }
      } else {
        results.push({
          shopifyId,
          shopifyTitle: sp.title,
          matched: false,
          updated: false,
        });
      }
    }

    const matchedCount = results.filter(r => r.matched).length;
    const updatedCount = results.filter(r => r.updated).length;

    console.log(`Sync complete: ${matchedCount}/${shopifyProducts.length} matched, ${updatedCount} updated`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalProducts: shopifyProducts.length,
        matchedCount,
        updatedCount,
        cjProductsAvailable: cjProducts.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing CJ costs:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
