import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
    
    if (!CJ_API_KEY) {
      console.error('CJ_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'CJ_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting CJ Access Token using API Key...');

    // Step 1: Get Access Token using the API Key
    const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: CJ_API_KEY,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', JSON.stringify(tokenData));

    if (!tokenData.data?.accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to get Access Token from CJ',
          error: tokenData.message || tokenData,
          code: tokenData.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.data.accessToken;
    console.log('Got Access Token, testing product list...');

    // Step 2: Test the API by fetching products
    const productResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=1&pageSize=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
    });

    const productData = await productResponse.json();
    console.log('Product API Response:', JSON.stringify(productData));

    if (productData.code === 200 || productData.result === true) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'CJ API Key is valid! Access Token obtained successfully.',
          tokenInfo: {
            accessToken: accessToken.substring(0, 20) + '...',
            expiresIn: tokenData.data.accessTokenExpiryDate
          },
          productSample: productData.data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Got Access Token but product API returned an error',
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
