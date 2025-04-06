import { Router } from 'express';
import { RecipeService } from '../services/recipe';

const router = Router();
const recipeService = new RecipeService();

// Parse recipe from URL
router.post('/parse', async (req, res) => {
  console.log('Recipe parse endpoint called with body:', req.body);
  const { url, servings } = req.body;
  console.log('Received recipe parse request:', { url, servings });

  if (!url) {
    console.log('No URL provided');
    return res.status(400).json({ error: 'Recipe URL is required' });
  }

  try {
    console.log('Attempting to scrape recipe from:', url);
    const recipe = await recipeService.scrapeRecipe(url);
    console.log('Successfully scraped recipe:', recipe);
    
    // Scale ingredients if servings specified
    if (servings && servings !== recipe.servings) {
      console.log('Scaling recipe from', recipe.servings, 'to', servings, 'servings');
      recipe.ingredients = recipeService.scaleIngredients(
        recipe.ingredients,
        recipe.servings,
        servings
      );
      recipe.servings = servings;
    }

    console.log('Sending recipe to client:', recipe);
    res.json(recipe);
  } catch (error) {
    console.error('Error parsing recipe:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to parse recipe' 
    });
  }
});

export default router; 