import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Shopify Storefront API Configuration
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'e7kzti-96.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '7adf5ac937177947a686836842f100fe';

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
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
          variants(first: 5) {
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

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
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
export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
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
}

// Fetch all products (with local overrides applied)
export async function fetchProducts(first: number = 20, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_QUERY, { first, query });
  const products = data.data.products.edges as ShopifyProduct[];
  return applyLocalOverrides(products);
}

// Fetch single product by handle (with local override applied)
export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct['node'] | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const product = data.data.product as ShopifyProduct["node"] | null;
  if (!product) return null;

  const [patched] = await applyLocalOverrides([{ node: product } as ShopifyProduct]);
  return patched?.node ?? product;
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
// Local Product Overrides (stored in database)
// ============================================================

type ProductOverridePatch = {
  title?: string | null;
  description?: string | null;
  price?: number | null;
};

async function upsertProductOverride(shopifyProductId: string, patch: ProductOverridePatch) {
  // Only update fields that are provided (avoid overwriting other fields with null).
  const updatePayload: Record<string, unknown> = {};
  if ("title" in patch) updatePayload.title = patch.title;
  if ("description" in patch) updatePayload.description = patch.description;
  if ("price" in patch) updatePayload.price = patch.price;

  const { data: existing, error: findError } = await supabase
    .from("product_overrides")
    .select("id")
    .eq("shopify_product_id", shopifyProductId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from("product_overrides")
      .update(updatePayload)
      .eq("shopify_product_id", shopifyProductId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from("product_overrides")
    .insert({ shopify_product_id: shopifyProductId, ...updatePayload });
  if (error) throw new Error(error.message);
}

async function applyLocalOverrides(products: ShopifyProduct[]): Promise<ShopifyProduct[]> {
  const ids = products.map((p) => p.node.id).filter(Boolean);
  if (ids.length === 0) return products;

  const { data, error } = await supabase
    .from("product_overrides")
    .select("shopify_product_id,title,description,price")
    .in("shopify_product_id", ids);

  if (error) {
    // Fail open: show Shopify data if overrides cannot be fetched.
    return products;
  }

  const byId = new Map<string, { title: string | null; description: string | null; price: number | null }>();
  (data || []).forEach((o) => {
    byId.set(o.shopify_product_id, {
      title: o.title,
      description: o.description,
      price: o.price,
    });
  });

  return products.map((p) => {
    const ov = byId.get(p.node.id);
    if (!ov) return p;

    return {
      ...p,
      node: {
        ...p.node,
        title: ov.title ?? p.node.title,
        description: ov.description ?? p.node.description,
        priceRange: {
          ...p.node.priceRange,
          minVariantPrice:
            ov.price != null
              ? { ...p.node.priceRange.minVariantPrice, amount: String(ov.price) }
              : p.node.priceRange.minVariantPrice,
        },
      },
    } as ShopifyProduct;
  });
}

export async function updateProductTitle(productId: string, newTitle: string): Promise<void> {
  await upsertProductOverride(productId, { title: newTitle });
}

export async function updateProductPrice(
  productId: string,
  _variantId: string,
  newPrice: string
): Promise<void> {
  const parsed = Number(newPrice);
  if (!Number.isFinite(parsed)) throw new Error("Precio inválido");
  await upsertProductOverride(productId, { price: parsed });
}

export async function updateProductDescription(productId: string, description: string): Promise<void> {
  await upsertProductOverride(productId, { description });
}

// NOTE: Image/product deletion require Shopify Admin API (not available in this project).
export async function deleteProductImage(_productId: string, _imageId: string): Promise<void> {
  throw new Error("Esta acción requiere permisos de edición en Shopify (no disponible).");
}

export async function addProductImage(
  _productId: string,
  _imageUrl: string,
  _imageAlt?: string
): Promise<unknown> {
  throw new Error("Esta acción requiere permisos de edición en Shopify (no disponible).");
}

export async function deleteProduct(_productId: string): Promise<void> {
  throw new Error("Esta acción requiere permisos de edición en Shopify (no disponible).");
}

