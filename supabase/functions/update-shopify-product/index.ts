import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, title } = await req.json();

    if (!productId || !title) {
      return new Response(
        JSON.stringify({ error: "Product ID and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    const SHOPIFY_STORE_DOMAIN = "e7kzti-96.myshopify.com";
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error("SHOPIFY_ACCESS_TOKEN not configured");
    }

    // Extract numeric ID from Shopify GID
    const numericId = productId.replace("gid://shopify/Product/", "");

    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericId}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          product: {
            id: numericId,
            title: title,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, product: data.product }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
