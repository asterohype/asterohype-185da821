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

  if (error) {
    console.error('Error fetching cached token:', error);
    return null;
  }

  if (data && new Date(data.expires_at) > new Date()) {
    return data.access_token;
  }

  return null;
}

async function getNewAccessToken(supabase: any, apiKey: string): Promise<string | null> {
  console.log('Fetching new Access Token from CJ...');

  const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.code !== 200 || !tokenData.data?.accessToken) {
    console.error('Failed to get Access Token:', tokenData.message);
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
  let token = await getCachedToken(supabase);
  if (!token) {
    token = await getNewAccessToken(supabase, apiKey);
  }
  return token;
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getAccessToken(supabase, CJ_API_KEY);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get CJ Access Token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for optional filters
    let keyword = '';
    let pageNum = 1;
    let pageSize = 50;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        keyword = body.keyword || '';
        pageNum = body.pageNum || 1;
        pageSize = body.pageSize || 50;
      } catch {
        // No body or invalid JSON, use defaults
      }
    }

    // Fetch My Products from CJ
    const url = new URL('https://developers.cjdropshipping.com/api2.0/v1/product/myProduct/query');
    if (keyword) url.searchParams.set('keyword', keyword);
    url.searchParams.set('pageNum', String(pageNum));
    url.searchParams.set('pageSize', String(pageSize));

    console.log('Fetching My Products from CJ:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
    });

    const data = await response.json();
    console.log('CJ My Products response code:', data.code);

    if (data.code !== 200) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'CJ API error',
          code: data.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const products: CJProduct[] = (data.data?.content || []).map((p: any) => ({
      productId: p.productId,
      nameEn: p.nameEn,
      sku: p.sku,
      sellPrice: p.sellPrice, // This is the cost from CJ
      totalPrice: p.totalPrice, // Total with shipping estimate
      bigImage: p.bigImage,
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        totalRecords: data.data?.totalRecords || 0,
        totalPages: data.data?.totalPages || 0,
        pageNumber: data.data?.pageNumber || 1,
        products,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching CJ products:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
