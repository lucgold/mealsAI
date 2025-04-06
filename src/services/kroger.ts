import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class KrogerService {
  private static readonly AUTH_URL = 'https://api.kroger.com/v1/connect/oauth2/authorize';
  private static readonly TOKEN_URL = 'https://api.kroger.com/v1/connect/oauth2/token';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    // Debug environment variables
    console.log('KrogerService environment variables:');
    console.log('KROGER_CLIENT_ID:', process.env.KROGER_CLIENT_ID ? 'Set' : 'Not set');
    console.log('KROGER_CLIENT_SECRET:', process.env.KROGER_CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('REDIRECT_URI:', process.env.REDIRECT_URI);
    
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

  async exchangeCodeForToken(code: string): Promise<any> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post(
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

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
} 