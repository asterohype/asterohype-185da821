import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Shopify Storefront API Configuration
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'e7kzti-96.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '7adf5ac937177947a686836842f100fe';

// Helper to get the current user's session token for authenticated requests
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa. Por favor, inicia sesión.');
  }
  return session.access_token;
}
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

// Fetch all products
export async function fetchProducts(first: number = 20, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_QUERY, { first, query });
  return data.data.products.edges;
}

// Fetch single product by handle
export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct['node'] | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data.data.product;
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

// Update product title via Admin API (through edge function)
export async function updateProductTitle(productId: string, newTitle: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, title: newTitle }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo actualizar el producto.';
    throw new Error(msg);
  }
}

// Update product variant price via Admin API (through edge function)
export async function updateProductPrice(productId: string, variantId: string, newPrice: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, variantId, price: newPrice }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo actualizar el precio.';
    throw new Error(msg);
  }
}

// Update product description via Admin API (through edge function)
export async function updateProductDescription(productId: string, description: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, description }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo actualizar la descripción.';
    throw new Error(msg);
  }
}

// Delete product image via Admin API
export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'delete_image', productId, imageId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo eliminar la imagen.';
    throw new Error(msg);
  }
}

// Add product image via Admin API
export async function addProductImage(productId: string, imageUrl: string, imageAlt?: string): Promise<unknown> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'add_image', productId, imageUrl, imageAlt }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo añadir la imagen.';
    throw new Error(msg);
  }

  return response.json();
}

// Delete product via Admin API
export async function deleteProduct(productId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-shopify-product`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'delete_product', productId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.error || 'No se pudo eliminar el producto.';
    throw new Error(msg);
  }
}
