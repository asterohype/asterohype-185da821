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

  if (error) {
    console.error('Error fetching cached token:', error);
    return null;
  }

  if (data && new Date(data.expires_at) > new Date()) {
    console.log('Using cached Access Token');
    return data.access_token;
  }

  return null;
}

async function getNewAccessToken(supabase: any, apiKey: string): Promise<string | null> {
  console.log('Fetching new Access Token from CJ...');

  const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: apiKey,
    }),
  });

  const tokenData = await tokenResponse.json();
  console.log('Token response code:', tokenData.code);

  if (tokenData.code !== 200 || !tokenData.data?.accessToken) {
    console.error('Failed to get Access Token:', tokenData.message);
    return null;
  }

  const accessToken = tokenData.data.accessToken;
  const expiresAt = tokenData.data.accessTokenExpiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Clear old tokens and save new one
  await supabase.from('cj_token_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error: insertError } = await supabase.from('cj_token_cache').insert({
    access_token: accessToken,
    refresh_token: tokenData.data.refreshToken || null,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error('Error caching token:', insertError);
  } else {
    console.log('Access Token cached successfully');
  }

  return accessToken;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!CJ_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'CJ_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try to get cached token first
    let accessToken = await getCachedToken(supabase);

    // If no cached token, get a new one
    if (!accessToken) {
      accessToken = await getNewAccessToken(supabase, CJ_API_KEY);
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to get Access Token. Rate limit may apply (1 request per 5 minutes).',
          hint: 'Wait 5 minutes and try again. The token will be cached for future requests.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test the API by fetching products
    console.log('Testing product list endpoint...');
    const productResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=1&pageSize=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
    });

    const productData = await productResponse.json();
    console.log('Product API Response code:', productData.code);

    if (productData.code === 200 || productData.result === true) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'CJ API is working! Token cached for future requests.',
          productsFound: productData.data?.list?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Product API returned an error',
          error: productData.message || productData,
          code: productData.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error testing CJ API:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
