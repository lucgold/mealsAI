import { Router } from 'express';
import { KrogerService } from '../services/kroger';

const router = Router();
const krogerService = new KrogerService();

// Initiate OAuth flow
router.get('/login', (req, res) => {
  const authUrl = krogerService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.redirect('http://localhost:5173?error=missing_code');
  }

  try {
    const tokenData = await krogerService.exchangeCodeForToken(code);
    
    // In a production environment, you would:
    // 1. Store tokens in a secure session or database
    // 2. Associate them with the user's session
    // For MVP, we'll store it in memory (not recommended for production)
    
    // Redirect back to frontend with success
    res.redirect('http://localhost:5173?auth=success');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect('http://localhost:5173?error=auth_failed');
  }
});

export default router; 