// @ts-ignore - Bypass TypeScript error for recipe-scraper module
const recipeScraper = require('recipe-scraper');
import { parseAllRecipes } from './allrecipes-parser';

export interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
  image?: string;
}

export class RecipeService {
  async scrapeRecipe(url: string): Promise<Recipe> {
    try {
      console.log('Fetching recipe from URL:', url);
      
      // Use custom AllRecipes parser if the URL is from AllRecipes
      if (url.includes('allrecipes.com/recipe')) {
        console.log('Using custom AllRecipes parser');
        return await parseAllRecipes(url);
      }
      
      // Use the generic recipe-scraper for other sites
      const scrapedRecipe = await recipeScraper(url);
      console.log('Successfully scraped recipe:', scrapedRecipe);

      // If the scraper returns an object with no ingredients or instructions, throw an error
      if (!scrapedRecipe || !scrapedRecipe.ingredients || !scrapedRecipe.instructions) {
        console.error('Recipe scraper returned incomplete data:', scrapedRecipe);
        throw new Error('Unable to extract recipe data from the provided URL');
      }

      return {
        name: scrapedRecipe.name || 'Untitled Recipe',
        ingredients: scrapedRecipe.ingredients || [],
        instructions: scrapedRecipe.instructions || [],
        servings: scrapedRecipe.servings || 4,
        image: scrapedRecipe.image
      };
    } catch (error) {
      console.error('Error scraping recipe:', error);
      if (error instanceof Error && error.message.includes('Unable to determine the recipe schema')) {
        throw new Error('This website is not supported for recipe scraping. Please try a different recipe URL.');
      }
      throw new Error('Failed to parse recipe. Please check the URL and try again.');
    }
  }

  scaleIngredients(ingredients: string[], originalServings: number, targetServings: number): string[] {
    if (originalServings === targetServings) return ingredients;
    
    const scaleFactor = targetServings / originalServings;
    
    return ingredients.map(ingredient => {
      // Try to find numbers in the ingredient string
      const numbers = ingredient.match(/\d*\.?\d+/g);
      if (!numbers) return ingredient;

      let scaledIngredient = ingredient;
      numbers.forEach(num => {
        const originalNum = parseFloat(num);
        const scaledNum = (originalNum * scaleFactor).toFixed(2);
        // Replace only the first occurrence of the number
        scaledIngredient = scaledIngredient.replace(num, scaledNum);
      });

      return scaledIngredient;
    });
  }
} 