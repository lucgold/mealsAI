import axios from 'axios';
import * as cheerio from 'cheerio';

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
      const response = await axios.get<string>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      console.log('Successfully fetched HTML');
      const $ = cheerio.load(response.data);
      
      // AllRecipes specific selectors
      const name = 
        $('h1[class*="heading"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('[class*="title"]').first().text().trim() ||
        'Untitled Recipe';
      console.log('Found recipe name:', name);

      // AllRecipes specific ingredient selectors
      let ingredients = [
        ...$('[class*="ingredients-item"]').map((_, el) => $(el).text().trim()).get(),
        ...$('[class*="ingredient"]').map((_, el) => $(el).text().trim()).get(),
        ...$('[class*="ingredients"] li').map((_, el) => $(el).text().trim()).get(),
        ...$('li:contains("cup"), li:contains("tablespoon"), li:contains("teaspoon"), li:contains("pound")').map((_, el) => $(el).text().trim()).get()
      ]
        .filter(Boolean)
        .map(ingredient => 
          ingredient
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter((ingredient, index, self) => 
          self.indexOf(ingredient) === index
        );

      console.log('Found ingredients:', ingredients.length);

      // AllRecipes specific instruction selectors
      let instructions = [
        ...$('[class*="instructions-section"]').map((_, el) => $(el).text().trim()).get(),
        ...$('[class*="instruction"], [class*="direction"]').map((_, el) => $(el).text().trim()).get(),
        ...$('[class*="instructions"] li').map((_, el) => $(el).text().trim()).get(),
        ...$('ol li, [class*="steps"] li').map((_, el) => $(el).text().trim()).get()
      ]
        .filter(Boolean)
        .map(instruction => 
          instruction
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter((instruction, index, self) => 
          self.indexOf(instruction) === index
        );

      console.log('Found instructions:', instructions.length);

      // Try to find servings
      const servingsText = 
        $('[class*="yield"]').text() ||
        $('[class*="serving"]').text() ||
        $('[class*="recipe-meta"]').text();
      const servingsMatch = servingsText.match(/\d+/);
      const servings = servingsMatch ? parseInt(servingsMatch[0]) : 4;
      console.log('Found servings:', servings);

      // Try to find image
      const image = 
        $('img[class*="recipe"], img[class*="hero"], [class*="featured-image"] img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content');
      console.log('Found image:', image ? 'yes' : 'no');

      // If no ingredients or instructions found, try to get HTML content for debugging
      if (!ingredients.length || !instructions.length) {
        console.log('Failed to find ingredients or instructions. HTML content:', response.data);
        throw new Error('Could not find recipe ingredients or instructions on the page.');
      }

      return {
        name,
        ingredients,
        instructions,
        servings,
        image
      };
    } catch (error) {
      console.error('Error scraping recipe:', error);
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