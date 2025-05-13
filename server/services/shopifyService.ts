interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  handle: string;
  createdAt: string;
  updatedAt: string;
  productType: string;
  tags: string[];
}

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
}

interface ShopifyImage {
  id: string;
  src: string;
  altText: string | null;
}

export class ShopifyService {
  private shopifyDomain: string | undefined;
  private storefrontAccessToken: string | undefined;
  private adminAccessToken: string | undefined;

  constructor() {
    this.shopifyDomain = process.env.SHOPIFY_DOMAIN;
    this.storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    this.adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken || '',
    };
  }

  private get adminHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.adminAccessToken || '',
    };
  }

  private get baseUrl() {
    return `https://${this.shopifyDomain}/api/2023-07/graphql.json`;
  }

  private get adminBaseUrl() {
    return `https://${this.shopifyDomain}/admin/api/2023-07/graphql.json`;
  }

  private async makeStorefrontRequest(query: string, variables: Record<string, any> = {}) {
    if (!this.shopifyDomain || !this.storefrontAccessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error making Shopify Storefront API request:', error);
      throw error;
    }
  }

  private async makeAdminRequest(query: string, variables: Record<string, any> = {}) {
    if (!this.shopifyDomain || !this.adminAccessToken) {
      throw new Error('Shopify admin credentials not configured');
    }

    try {
      const response = await fetch(this.adminBaseUrl, {
        method: 'POST',
        headers: this.adminHeaders,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify Admin API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error making Shopify Admin API request:', error);
      throw error;
    }
  }

  async getProducts(limit = 10, cursor?: string) {
    const query = `
      query GetProducts($limit: Int!, $cursor: String) {
        products(first: $limit, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              tags
              productType
            }
          }
        }
      }
    `;

    const variables = { limit, cursor };
    const response = await this.makeStorefrontRequest(query, variables);
    
    return {
      products: response.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        description: edge.node.description,
        handle: edge.node.handle,
        image: edge.node.featuredImage?.url,
        price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
        compareAtPrice: edge.node.compareAtPriceRange.minVariantPrice.amount 
          ? parseFloat(edge.node.compareAtPriceRange.minVariantPrice.amount) 
          : null,
        tags: edge.node.tags,
        productType: edge.node.productType
      })),
      pageInfo: response.data.products.pageInfo
    };
  }

  async getProductByHandle(handle: string) {
    const query = `
      query GetProductByHandle($handle: String!) {
        product(handle: $handle) {
          id
          title
          description
          handle
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
              }
            }
          }
          tags
          productType
        }
      }
    `;

    const variables = { handle };
    const response = await this.makeStorefrontRequest(query, variables);
    
    if (!response.data.product) {
      return null;
    }
    
    return {
      id: response.data.product.id,
      title: response.data.product.title,
      description: response.data.product.description,
      handle: response.data.product.handle,
      images: response.data.product.images.edges.map((edge: any) => ({
        url: edge.node.url,
        altText: edge.node.altText
      })),
      variants: response.data.product.variants.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: parseFloat(edge.node.price.amount),
        compareAtPrice: edge.node.compareAtPrice ? parseFloat(edge.node.compareAtPrice.amount) : null,
        availableForSale: edge.node.availableForSale,
        quantityAvailable: edge.node.quantityAvailable
      })),
      tags: response.data.product.tags,
      productType: response.data.product.productType
    };
  }

  async getProductsByType(productType: string, limit = 10, cursor?: string) {
    const query = `
      query GetProductsByType($productType: String!, $limit: Int!, $cursor: String) {
        products(first: $limit, after: $cursor, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              tags
              productType
            }
          }
        }
      }
    `;

    const variables = { 
      limit, 
      cursor,
      query: `product_type:${productType}` 
    };
    
    const response = await this.makeStorefrontRequest(query, variables);
    
    return {
      products: response.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        description: edge.node.description,
        handle: edge.node.handle,
        image: edge.node.featuredImage?.url,
        price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
        compareAtPrice: edge.node.compareAtPriceRange.minVariantPrice.amount 
          ? parseFloat(edge.node.compareAtPriceRange.minVariantPrice.amount) 
          : null,
        tags: edge.node.tags,
        productType: edge.node.productType
      })),
      pageInfo: response.data.products.pageInfo
    };
  }
  
  async searchProducts(query: string, limit = 10, cursor?: string) {
    const gqlQuery = `
      query SearchProducts($query: String!, $limit: Int!, $cursor: String) {
        products(first: $limit, after: $cursor, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              tags
              productType
            }
          }
        }
      }
    `;

    const variables = { query, limit, cursor };
    const response = await this.makeStorefrontRequest(gqlQuery, variables);
    
    return {
      products: response.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        description: edge.node.description,
        handle: edge.node.handle,
        image: edge.node.featuredImage?.url,
        price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
        compareAtPrice: edge.node.compareAtPriceRange.minVariantPrice.amount 
          ? parseFloat(edge.node.compareAtPriceRange.minVariantPrice.amount) 
          : null,
        tags: edge.node.tags,
        productType: edge.node.productType
      })),
      pageInfo: response.data.products.pageInfo
    };
  }

  async getCollections(limit = 10, cursor?: string) {
    const query = `
      query GetCollections($limit: Int!, $cursor: String) {
        collections(first: $limit, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              image {
                url
                altText
              }
            }
          }
        }
      }
    `;

    const variables = { limit, cursor };
    const response = await this.makeStorefrontRequest(query, variables);
    
    return {
      collections: response.data.collections.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        description: edge.node.description,
        handle: edge.node.handle,
        image: edge.node.image?.url
      })),
      pageInfo: response.data.collections.pageInfo
    };
  }

  async getCollectionByHandle(handle: string, limit = 10, cursor?: string) {
    const query = `
      query GetCollectionByHandle($handle: String!, $limit: Int!, $cursor: String) {
        collection(handle: $handle) {
          id
          title
          description
          handle
          image {
            url
            altText
          }
          products(first: $limit, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                description
                handle
                featuredImage {
                  url
                  altText
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                tags
                productType
              }
            }
          }
        }
      }
    `;

    const variables = { handle, limit, cursor };
    const response = await this.makeStorefrontRequest(query, variables);
    
    if (!response.data.collection) {
      return null;
    }
    
    return {
      id: response.data.collection.id,
      title: response.data.collection.title,
      description: response.data.collection.description,
      handle: response.data.collection.handle,
      image: response.data.collection.image?.url,
      products: response.data.collection.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        description: edge.node.description,
        handle: edge.node.handle,
        image: edge.node.featuredImage?.url,
        price: parseFloat(edge.node.priceRange.minVariantPrice.amount),
        compareAtPrice: edge.node.compareAtPriceRange.minVariantPrice.amount 
          ? parseFloat(edge.node.compareAtPriceRange.minVariantPrice.amount) 
          : null,
        tags: edge.node.tags,
        productType: edge.node.productType
      })),
      pageInfo: response.data.collection.products.pageInfo
    };
  }

  async createCheckout(items: { variantId: string, quantity: number }[]) {
    const query = `
      mutation CheckoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            subtotalPrice {
              amount
              currencyCode
            }
            totalPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))
      }
    };

    const response = await this.makeStorefrontRequest(query, variables);
    
    if (response.data.checkoutCreate.checkoutUserErrors.length > 0) {
      throw new Error(response.data.checkoutCreate.checkoutUserErrors[0].message);
    }
    
    return {
      id: response.data.checkoutCreate.checkout.id,
      webUrl: response.data.checkoutCreate.checkout.webUrl,
      subtotalPrice: parseFloat(response.data.checkoutCreate.checkout.subtotalPrice.amount),
      totalPrice: parseFloat(response.data.checkoutCreate.checkout.totalPrice.amount),
      totalTax: parseFloat(response.data.checkoutCreate.checkout.totalTax.amount)
    };
  }
}
