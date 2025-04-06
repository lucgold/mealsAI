import { Router } from 'express';
import { RecipeService } from '../services/recipe';

const router = Router();
const recipeService = new RecipeService();

// Parse recipe from URL
router.post('/parse', async (req, res) => {
  const { url, servings } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Recipe URL is required' });
  }

  try {
    const recipe = await recipeService.scrapeRecipe(url);
    
    // Scale ingredients if servings specified
    if (servings && servings !== recipe.servings) {
      recipe.ingredients = recipeService.scaleIngredients(
        recipe.ingredients,
        recipe.servings,
        servings
      );
      recipe.servings = servings;
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error parsing recipe:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to parse recipe' 
    });
  }
});

export default router; 