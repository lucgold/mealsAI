import express from 'express';
import { KrogerService } from '../services/kroger';

const router = express.Router();
const krogerService = new KrogerService();

// Search for products
router.get('/search', async (req, res) => {
  try {
    const { term, locationId, limit, start } = req.query;
    
    if (!term || typeof term !== 'string') {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const products = await krogerService.searchProducts(
      term,
      typeof locationId === 'string' ? locationId : undefined,
      typeof limit === 'string' ? parseInt(limit) : undefined,
      typeof start === 'string' ? parseInt(start) : undefined
    );

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Find best match for an ingredient
router.get('/match', async (req, res) => {
  try {
    const { ingredient } = req.query;
    
    if (!ingredient || typeof ingredient !== 'string') {
      return res.status(400).json({ error: 'Ingredient is required' });
    }

    const match = await krogerService.findBestMatch(ingredient);
    
    if (!match) {
      return res.status(404).json({ error: 'No matching product found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error finding product match:', error);
    res.status(500).json({ error: 'Failed to find product match' });
  }
});

export default router; 