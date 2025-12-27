import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_STORE_DOMAIN = "e7kzti-96.myshopify.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("AUTH: No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No autorizado: Falta el header de autorización" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("AUTH: Empty bearer token");
      return new Response(
        JSON.stringify({ error: "No autorizado: Token vacío" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // IMPORTANT: In edge/runtime there is no persisted session; pass the token explicitly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("AUTH: Invalid token or user not found", authError);
      return new Response(
        JSON.stringify({ error: "No autorizado: Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ADMIN ROLE CHECK ==========
    // Check if user is in user_roles table as admin OR is the specific owner email
    let isAdmin = false;

    // 1. Check by email (Hardcoded safety for owner)
    if (user.email === 'asterohype@gmail.com' || user.email === 'neomaffofficial@gmail.com') {
      console.log(`AUTH: User ${user.email} is recognized as OWNER/ADMIN by email.`);
      isAdmin = true;
    } else {
      // 2. Check by DB role
      const { data: roleData, error: roleError } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (roleData) {
        isAdmin = true;
      } else if (roleError) {
        console.error("AUTH: Error checking user role", roleError);
      }
    }

    if (!isAdmin) {
      console.error(`AUTH: User ${user.email} is not admin`);
      return new Response(
        JSON.stringify({ error: "Prohibido: Se requiere acceso de administrador" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`ADMIN ACTION: User ${user.email} (${user.id}) performing Shopify operation`);

    // ========== PROCESS REQUEST ==========
    const { action, productId, title, description, price, variantId, imageId, imageUrl, imageAlt, tags } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Credenciales Admin API
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    
    console.log(`Using Shopify Token (Length: ${SHOPIFY_ACCESS_TOKEN.length})`);

    // FIX: Ensure ID is purely numeric. Handle cases where it might be full gid or just number.
    // If input is "gid://shopify/Product/12345", replace removes prefix -> "12345"
    // If input is "12345", replace does nothing -> "12345"
    const numericProductId = String(productId).replace("gid://shopify/Product/", "");
    
    console.log(`Processing Product ID: Raw='${productId}' -> Numeric='${numericProductId}'`);

    // Header estándar para Admin API (X-Shopify-Access-Token)
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    };

    // Log the action for audit
    console.log(`SHOPIFY OP: action=${action || 'update'}, productId=${numericProductId}, user=${user.email}`);

    // Update product fields (title, description, tags)
    if (title || description !== undefined || tags !== undefined) {
      const productUpdate: Record<string, unknown> = { id: numericProductId };
      if (title) productUpdate.title = title;
      if (description !== undefined) productUpdate.body_html = description;
      if (tags !== undefined) productUpdate.tags = tags;
      
      console.log(`Sending update to Shopify: ${JSON.stringify(productUpdate)}`);

      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}.json`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ product: productUpdate }),
        }
      );
      
      console.log(`Shopify Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (product):", errorText);

        // Most common cause: wrong token type (Storefront token) or invalid Admin token
        if (response.status === 401) {
          return new Response(
            JSON.stringify({
              error:
                "No autorizado para editar productos (token de administrador inválido).",
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            error: `Shopify API error: ${response.status}`,
            details: errorText,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update variant price
    if (price && variantId) {
      const numericVariantId = variantId.replace("gid://shopify/ProductVariant/", "");
      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/variants/${numericVariantId}.json`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ variant: { id: numericVariantId, price } }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (variant):", errorText);

        if (response.status === 401) {
          return new Response(
            JSON.stringify({
              error:
                "No autorizado para editar precios (token de administrador inválido).",
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            error: `Shopify API error updating price: ${response.status}`,
            details: errorText,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Delete product
    if (action === "delete_product") {
      console.log(`CRITICAL: Admin ${user.email} DELETING product ${numericProductId}`);
      
      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}.json`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (delete product):", errorText);
        throw new Error(`Shopify API error deleting product: ${response.status}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Product deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete image
    if (action === "delete_image" && imageId) {
      const numericImageId = imageId.replace("gid://shopify/ProductImage/", "");
      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}/images/${numericImageId}.json`,
        { method: "DELETE", headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (delete image):", errorText);
        throw new Error(`Shopify API error deleting image: ${response.status}`);
      }
    }

    // Add new image
    if (action === "add_image" && imageUrl) {
      const imagePayload: Record<string, unknown> = { src: imageUrl };
      if (imageAlt) imagePayload.alt = imageAlt;

      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}/images.json`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ image: imagePayload }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (add image):", errorText);
        throw new Error(`Shopify API error adding image: ${response.status}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, image: data.image }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update image alt text
    if (action === "update_image" && imageId) {
      const numericImageId = imageId.replace("gid://shopify/ProductImage/", "");
      const imagePayload: Record<string, unknown> = { id: numericImageId };
      if (imageAlt !== undefined) imagePayload.alt = imageAlt;

      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/products/${numericProductId}/images/${numericImageId}.json`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ image: imagePayload }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shopify API error (update image):", errorText);
        throw new Error(`Shopify API error updating image: ${response.status}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    // DEBUG: Return full error details to frontend for diagnosis
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack,
        details: "Check console for full logs"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
