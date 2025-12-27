
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'e7kzti-96.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/2025-10/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '7adf5ac937177947a686836842f100fe';

async function fetchShopify(query, variables) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}

async function testFetch() {
  const limit = 1000;
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  const perPage = 50; // mimicking current code

  const PAGINATED_QUERY = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `;

  console.log('Starting fetch...');
  let page = 1;

  while (hasNextPage && allProducts.length < limit) {
    console.log(`Fetching page ${page}... (current count: ${allProducts.length})`);
    const data = await fetchShopify(PAGINATED_QUERY, {
      first: Math.min(perPage, limit - allProducts.length),
      after: cursor
    });

    if (data.errors) {
        console.error('Errors:', data.errors);
        break;
    }

    const edges = data.data.products.edges;
    console.log(`Got ${edges.length} products on page ${page}`);
    allProducts = [...allProducts, ...edges];
    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;
    page++;
  }

  console.log(`Total products fetched: ${allProducts.length}`);
}

testFetch();
