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
    const { productId, title, price, variantId } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    const SHOPIFY_STORE_DOMAIN = "e7kzti-96.myshopify.com";
    
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error("SHOPIFY_ACCESS_TOKEN not configured");
    }

    // Extract numeric ID from Shopify GID
    const numericProductId = productId.replace("gid://shopify/Product/", "");

    // Build product update payload
    const productUpdate: Record<string, unknown> = { id: numericProductId };
    if (title) productUpdate.title = title;

    // Update product title if provided
    if (title) {
      const productResponse = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          },
          body: JSON.stringify({ product: productUpdate }),
        }
      );

      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        console.error("Shopify API error (product):", errorText);
        throw new Error(`Shopify API error: ${productResponse.status}`);
      }
    }

    // Update variant price if provided
    if (price && variantId) {
      const numericVariantId = variantId.replace("gid://shopify/ProductVariant/", "");
      
      const variantResponse = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/variants/${numericVariantId}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          },
          body: JSON.stringify({
            variant: {
              id: numericVariantId,
              price: price,
            },
          }),
        }
      );

      if (!variantResponse.ok) {
        const errorText = await variantResponse.text();
        console.error("Shopify API error (variant):", errorText);
        throw new Error(`Shopify API error updating price: ${variantResponse.status}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
