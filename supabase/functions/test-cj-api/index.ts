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

    console.log('Testing CJ API with key...');

    // Test the CJ API by getting access token
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '', // CJ requires email for token, but API key method differs
        password: '',
        refreshToken: CJ_API_KEY, // Try using as refresh token
      }),
    });

    // Alternative: Try direct API call with key as bearer
    const productResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=1&pageSize=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': CJ_API_KEY,
      },
    });

    const productData = await productResponse.json();
    console.log('CJ API Response:', JSON.stringify(productData));

    if (productData.code === 200 || productData.result === true) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'CJ API Key is valid!',
          data: productData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'CJ API returned an error',
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
