import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Shopify Storefront API Configuration
const SHOPIFY_API_VERSION = '2025-10';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'e7kzti-96.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '7adf5ac937177947a686836842f100fe';

// Simple in-memory cache for products to speed up Admin
let productsCache: {
  data: ShopifyProduct[];
  timestamp: number;
  isComplete?: boolean;
} | null = null;

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml?: string;
    handle: string;
    productType: string;
    tags: string[];
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

export interface CartItem {
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

// GraphQL Queries
const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          descriptionHtml
          handle
          productType
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 2) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

const PRODUCT_BY_ID_QUERY = `
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      title
      description
      descriptionHtml
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 250) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      descriptionHtml
      handle
      productType
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Storefront API Helper
export async function storefrontApiRequest(
  query: string,
  variables: Record<string, unknown> = {},
  opts: { timeoutMs?: number } = {}
) {
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const t = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
    });

    if (response.status === 402) {
      toast.error("Shopify: Payment required", {
        description: "Shopify API access requires an active billing plan.",
      });
      throw new Error("Payment required");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    return data;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error(`Shopify request timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    window.clearTimeout(t);
  }
}

// Fetch all products with pagination support
export async function fetchProducts(first: number = 20, query?: string): Promise<ShopifyProduct[]> {
  // Check cache first if no specific query (dashboard view)
  if (!query && first >= 50 && productsCache) {
    const now = Date.now();
    // 5 minutes cache validity
    if (now - productsCache.timestamp < 1000 * 60 * 5) {
      // Return cache if it has enough data OR if it represents the complete catalog
      if (productsCache.data.length >= first || productsCache.isComplete) {
        console.log('Using cached products');
        return productsCache.data.slice(0, first);
      }
    }
  }

  // If requesting 250 or less, a single request is enough.
  if (first <= 250) {
    const data = await storefrontApiRequest(STOREFRONT_QUERY, { first, query }, { timeoutMs: 15000 });
    const products = data.data.products.edges as ShopifyProduct[];
    
    // Update cache if this was a broad fetch
    if (!query && first >= 50) {
      productsCache = {
        data: products,
        timestamp: Date.now(),
        isComplete: products.length < first // If we got fewer than requested, we have them all
      };
    }
    
    return products;
  }
  
  // Paginate to fetch all products
  let allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const perPage = 250; // Increased from 50 to 250 for better performance
  
  const PAGINATED_QUERY = `
    query GetProducts($first: Int!, $query: String, $after: String) {
      products(first: $first, query: $query, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            description
            descriptionHtml
            handle
            productType
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 2) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
            options {
              name
              values
            }
          }
        }
      }
    }
  `;
  
  while (hasNextPage && allProducts.length < first) {
    const data = await storefrontApiRequest(
      PAGINATED_QUERY,
      {
        first: Math.min(perPage, first - allProducts.length),
        query,
        after: cursor,
      },
      { timeoutMs: 20000 }
    );
    const edges = data.data.products.edges as ShopifyProduct[];
    allProducts = [...allProducts, ...edges];
    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;
  }

  // Update cache if this was a broad fetch
  if (!query && first >= 50) {
    productsCache = {
      data: allProducts,
      timestamp: Date.now(),
      isComplete: allProducts.length < first || !hasNextPage
    };
  }
  
  return allProducts;
}

// Fetch single product by ID
export async function fetchProductById(id: string): Promise<ShopifyProduct['node'] | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_ID_QUERY, { id });
  return (data.data.product as ShopifyProduct["node"] | null) ?? null;
}

// Fetch single product by handle
export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct['node'] | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return (data.data.product as ShopifyProduct["node"] | null) ?? null;
}

// Create checkout
export async function createStorefrontCheckout(items: CartItem[]): Promise<string> {
  const lines = items.map(item => ({
    quantity: item.quantity,
    merchandiseId: item.variantId,
  }));

  const cartData = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { lines },
  });

  if (cartData.data.cartCreate.userErrors.length > 0) {
    throw new Error(`Cart creation failed: ${cartData.data.cartCreate.userErrors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  const cart = cartData.data.cartCreate.cart;

  if (!cart.checkoutUrl) {
    throw new Error('No checkout URL returned from Shopify');
  }

  const url = new URL(cart.checkoutUrl);
  url.searchParams.set('channel', 'online_store');
  return url.toString();
}

// Format price helper
export function formatPrice(amount: string, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

// ============================================================
// Admin product updates (writes to Shopify via backend function)
// ============================================================

type UpdateShopifyProductAction =
  | { action: 'update_title'; productId: string; title: string }
  | { action: 'update_description'; productId: string; description: string }
  | { action: 'update_tags'; productId: string; tags: string }
  | { action: 'update_variant_price'; productId: string; variantId: string; price: string }
  | { action: 'update_options'; productId: string; options: any[] }
  | { action: 'update_variant'; productId: string; variantId: string; updates: any }
  | { action: 'delete_product_image'; productId: string; imageId: string }
  | { action: 'add_product_image'; productId: string; imageUrl: string; altText?: string }
  | { action: 'delete_product'; productId: string };

type ShopifyWriteResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function normalizeShopifyWriteError(message: string) {
  // Avoid surfacing internal implementation details in the UI.
  if (
    message.toLowerCase().includes('token de administrador inválido') ||
    message.toLowerCase().includes('invalid api key') ||
    message.toLowerCase().includes('access token')
  ) {
    return 'Edición en Shopify no disponible ahora mismo.';
  }
  return message || 'No se pudo completar la acción en Shopify.';
}

// Local Proxy fallback function for development
async function fallbackToLocalProxy(payload: UpdateShopifyProductAction): Promise<ShopifyWriteResult> {
  // Allow proxy in development mode
  if (!import.meta.env.DEV) return { ok: false, message: "Proxy fallback only available in dev" };

  try {
    const { action, productId } = payload;
    const numericProductId = productId.replace("gid://shopify/Product/", "");
    
    let url = '';
    let method = '';
    let body = {};

    if (action === 'update_title') {
      url = `/api/shopify-admin/products/${numericProductId}.json`;
      method = 'PUT';
      body = { product: { id: numericProductId, title: payload.title } };
    } else if (action === 'update_description') {
      url = `/api/shopify-admin/products/${numericProductId}.json`;
      method = 'PUT';
      body = { product: { id: numericProductId, body_html: payload.description } };
    } else if (action === 'update_tags') {
      url = `/api/shopify-admin/products/${numericProductId}.json`;
      method = 'PUT';
      body = { product: { id: numericProductId, tags: payload.tags } };
    } else if (action === 'update_variant_price') {
      const numericVariantId = payload.variantId.replace("gid://shopify/ProductVariant/", "");
      url = `/api/shopify-admin/variants/${numericVariantId}.json`;
      method = 'PUT';
      body = { variant: { id: numericVariantId, price: payload.price } };
    } else if (action === 'delete_product') {
      url = `/api/shopify-admin/products/${numericProductId}.json`;
      method = 'DELETE';
    } else if (action === 'delete_product_image') {
       // Shopify API requires product ID to delete image: DELETE /admin/api/2024-01/products/{product_id}/images/{image_id}.json
       const numericImageId = payload.imageId.replace("gid://shopify/ProductImage/", "");
       url = `/api/shopify-admin/products/${numericProductId}/images/${numericImageId}.json`;
       method = 'DELETE';
    } else if (action === 'add_product_image') {
       url = `/api/shopify-admin/products/${numericProductId}/images.json`;
       method = 'POST';
       body = { image: { src: payload.imageUrl, alt: payload.altText } };
    } else {
      console.warn("Action not supported in local proxy fallback:", action);
      return { ok: false, message: "Action not supported locally" };
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'DELETE' ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Local Proxy Error:", text);
      return { ok: false, message: `Local Proxy Error: ${response.status} - ${text}` };
    }

    return { ok: true };

  } catch (err) {
    console.error("Local Proxy Exception:", err);
    return { ok: false, message: "Local Proxy Exception" };
  }
}

async function invokeUpdateShopifyProduct(
  payload: UpdateShopifyProductAction
): Promise<ShopifyWriteResult> {
  // --- LOCAL DEV OVERRIDE ---
  // If we are in development, try local proxy first
  if (import.meta.env.DEV) {
    console.log("DEV MODE: Attempting to use local proxy for Shopify update...");
    const result = await fallbackToLocalProxy(payload);
    if (result.ok) {
      toast.success("Actualizado en Shopify (Local Proxy)");
      return result;
    }
    console.warn("Local proxy failed...", result.message);
  }
  // ---------------------------

  // --- VERCEL PRODUCTION API ---
  // Use Vercel Serverless Function instead of Supabase Edge Function
  // This bypasses Supabase infrastructure issues while keeping auth
  
  // Get session explicitly to ensure token is fresh
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error("AUTH: No session token found before invoking function");
    toast.error("Error de autenticación: No hay sesión activa");
    return { ok: false, message: "No session token" };
  }

  try {
    const response = await fetch('/api/shopify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      const errorMessage = errorData.error || `Error ${response.status}`;
      
      console.error("❌ ERROR AL ACTUALIZAR SHOPIFY (Vercel API):", errorMessage);
      
      if (response.status === 401) {
         toast.error("Sesión caducada", {
           description: "Tu sesión ha expirado. Por favor, cierra sesión y vuelve a entrar.",
           action: {
             label: "Cerrar sesión",
             onClick: async () => {
               await supabase.auth.signOut();
               window.location.reload();
             }
           },
           duration: 10000,
         });
         return { ok: false, message: "Sesión caducada" };
      }

      toast.error(`Error: ${errorMessage}`);
      return { ok: false, message: errorMessage };
    }

    return { ok: true };

  } catch (error) {
    console.error("❌ EXCEPTION AL ACTUALIZAR SHOPIFY:", error);
    toast.error(`Error de conexión: ${(error as Error).message}`);
    return { ok: false, message: (error as Error).message };
  }
}

export async function updateProductTitle(
  productId: string,
  newTitle: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'update_title', productId, title: newTitle });
}

export async function updateProductPrice(
  productId: string,
  variantId: string,
  newPrice: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({
    action: 'update_variant_price',
    productId,
    variantId,
    price: newPrice,
  });
}

export async function updateProductDescription(
  productId: string,
  description: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'update_description', productId, description });
}

export async function updateProductTags(
  productId: string,
  tags: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'update_tags', productId, tags });
}

export async function updateProductOptions(
  productId: string,
  options: any[]
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'update_options', productId, options });
}

export async function updateVariant(
  productId: string,
  variantId: string,
  updates: any
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'update_variant', productId, variantId, updates });
}

export async function updateShopifyProduct(params: {
  id: string;
  title?: string;
  descriptionHtml?: string;
  price?: string;
  tags?: string;
}): Promise<ShopifyWriteResult> {
  // Use invokeUpdateShopifyProduct for each field if needed, or expand backend to handle multiple
  // For now, we chain them if multiple fields provided, but ModoIAPanel uses descriptionHtml which needs backend support
  // Actually, we can reuse updateProductDescription if we treat descriptionHtml as description, 
  // BUT Shopify API distinguishes description (text) vs descriptionHtml.
  
  // Let's implement a generic update action that can handle html description
  if (params.descriptionHtml) {
    await invokeUpdateShopifyProduct({ 
      action: 'update_description', // Map to update_description which handles body_html
      productId: params.id, 
      description: params.descriptionHtml 
    });
  }

  if (params.tags) {
    await invokeUpdateShopifyProduct({
      action: 'update_tags',
      productId: params.id,
      tags: params.tags
    });
  }
  
  if (params.title) {
    return updateProductTitle(params.id, params.title);
  }

  return { ok: true };
}

export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'delete_product_image', productId, imageId });
}

export async function addProductImage(
  productId: string,
  imageUrl: string,
  imageAlt?: string
): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({
    action: 'add_product_image',
    productId,
    imageUrl,
    altText: imageAlt,
  });
}

export async function deleteProduct(productId: string): Promise<ShopifyWriteResult> {
  return invokeUpdateShopifyProduct({ action: 'delete_product', productId });
}



