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

    const { vid, quantity = 1, destCountry = 'ES', startCountry = 'CN' } = await req.json();

    if (!vid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Variant ID (vid) is required' }),
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

    console.log('Calculating freight for vid:', vid, 'from', startCountry, 'to', destCountry);

    const freightResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
      body: JSON.stringify({
        startCountryCode: startCountry,
        endCountryCode: destCountry,
        products: [{ vid, quantity }],
      }),
    });

    const freightData = await freightResponse.json();
    console.log('Freight response code:', freightData.code);

    if (freightData.code !== 200 || !freightData.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: freightData.message || 'Failed to calculate freight',
          code: freightData.code 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return all shipping options
    const shippingOptions = (freightData.data || []).map((option: any) => ({
      name: option.logisticName,
      price: option.logisticPrice,
      priceCny: option.logisticPriceCn,
      deliveryTime: option.logisticAging,
      taxesFee: option.taxesFee || 0,
      clearanceFee: option.clearanceOperationFee || 0,
      totalPostage: option.totalPostageFee || option.logisticPrice,
    }));

    // Find cheapest option
    const cheapestOption = shippingOptions.reduce((min: any, opt: any) => 
      opt.price < min.price ? opt : min, shippingOptions[0]);

    return new Response(
      JSON.stringify({ 
        success: true,
        shippingOptions,
        cheapestOption,
        destination: destCountry,
        origin: startCountry,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating freight:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
