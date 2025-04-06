import axios from 'axios';

interface KrogerProduct {
  productId: string;
  upc: string;
  brand: string;
  description: string;
  size: string;
  images: {
    perspective: string;
    sizes: { size: string; url: string }[];
  }[];
  items: {
    itemId: string;
    price: {
      regular: number;
      promo: number;
    };
    size: string;
    soldBy: string;
  }[];
}

interface ProductSearchResponse {
  data: KrogerProduct[];
  meta: {
    pagination: {
      total: number;
      start: number;
      limit: number;
    };
  };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class KrogerService {
  private static readonly AUTH_URL = 'https://api.kroger.com/v1/connect/oauth2/authorize';
  private static readonly TOKEN_URL = 'https://api.kroger.com/v1/connect/oauth2/token';
  private static readonly PRODUCT_URL = 'https://api.kroger.com/v1/products';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken: string | null = null;

  constructor() {
    const { KROGER_CLIENT_ID, KROGER_CLIENT_SECRET, REDIRECT_URI } = process.env;

    if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error('Missing required Kroger credentials in environment variables');
    }

    this.clientId = KROGER_CLIENT_ID;
    this.clientSecret = KROGER_CLIENT_SECRET;
    this.redirectUri = REDIRECT_URI;
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'product.compact cart.basic:write'
    });

    return `${KrogerService.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post<TokenResponse>(
        KrogerService.TOKEN_URL,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async searchProducts(
    term: string,
    locationId: string = '01400943', // Default to a Kroger store
    limit: number = 5,
    start: number = 1
  ): Promise<ProductSearchResponse> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please connect to Kroger first.');
    }

    try {
      const params = new URLSearchParams({
        'filter.term': term,
        'filter.locationId': locationId,
        'filter.limit': limit.toString(),
        'filter.start': start.toString(),
      });

      const response = await axios.get<ProductSearchResponse>(
        `${KrogerService.PRODUCT_URL}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async findBestMatch(ingredient: string): Promise<KrogerProduct | null> {
    try {
      // Remove quantities and units from the ingredient name
      const searchTerm = ingredient
        .replace(/^\d+\/?\d*\s*/, '') // Remove fractions/numbers at start
        .replace(/\d+(\.\d+)?\s*(oz|ounce|pound|lb|gram|g|cup|tbsp|tsp|tablespoon|teaspoon)s?\b/gi, '') // Remove units
        .replace(/\(.*?\)/g, '') // Remove parentheses and their contents
        .trim();

      const response = await this.searchProducts(searchTerm);
      
      if (response.data.length === 0) {
        return null;
      }

      // For now, just return the first result
      // TODO: Implement better matching logic based on brand, size, price, etc.
      return response.data[0];
    } catch (error) {
      console.error('Error finding best match for ingredient:', error);
      return null;
    }
  }
} 