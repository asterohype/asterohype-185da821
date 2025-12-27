import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!CJ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cjProductId, cjSku, productName } = await req.json();

    if (!cjProductId && !cjSku && !productName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either cjProductId, cjSku, or productName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getAccessToken(supabase, CJ_API_KEY);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get CJ Access Token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If searching by name, use the listV2 endpoint (GET with keyWord)
    if (productName && !cjProductId && !cjSku) {
      const searchUrl = new URL('https://developers.cjdropshipping.com/api2.0/v1/product/listV2');
      searchUrl.searchParams.set('keyWord', productName);
      searchUrl.searchParams.set('page', '1');
      searchUrl.searchParams.set('size', '20');
      
      console.log('Searching CJ products by keyword:', productName);
      
      const searchResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': accessToken,
        },
      });

      const searchData = await searchResponse.json();
      console.log('CJ Search response code:', searchData.code, 'total:', searchData.data?.totalRecords || 0);

      const productList = searchData.data?.content?.[0]?.productList || [];
      
      if (searchData.code !== 200 || productList.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No products found matching the name',
            searchQuery: productName,
            apiCode: searchData.code,
            apiMessage: searchData.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return the search results for user to pick
      const products = productList.map((p: any) => ({
        productId: p.id,
        productName: p.nameEn,
        sku: p.sku,
        sellPrice: p.sellPrice,
        discountPrice: p.discountPrice,
        productImage: p.bigImage,
      }));

      return new Response(
        JSON.stringify({ 
          success: true,
          searchResults: products,
          totalFound: searchData.data?.totalRecords || products.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch product details from CJ
    const url = new URL('https://developers.cjdropshipping.com/api2.0/v1/product/query');
    if (cjProductId) {
      url.searchParams.set('pid', cjProductId);
    } else if (cjSku) {
      url.searchParams.set('productSku', cjSku);
    }

    console.log('Fetching CJ product details:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
    });

    const data = await response.json();
    console.log('CJ Product response code:', data.code);

    if (data.code !== 200 || !data.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'Product not found',
          code: data.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = data.data;

    // Get variants with prices
    const variants = (product.variants || []).map((v: any) => ({
      vid: v.vid,
      variantSku: v.variantSku,
      variantNameEn: v.variantNameEn,
      variantPrice: v.variantSellPrice || v.variantPrice,
      variantWeight: v.variantWeight,
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        product: {
          productId: product.pid,
          productName: product.productNameEn,
          sku: product.productSku,
          sellPrice: product.sellPrice, // Base cost from CJ
          productImage: product.productImage,
          productWeight: product.productWeight,
          categoryName: product.categoryName,
          variants,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching CJ product:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
