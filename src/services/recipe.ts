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
      const response = await axios.get<string>(url);
      const $ = cheerio.load(response.data, {
        decodeEntities: true,
        normalizeWhitespace: true
      });
      
      // Try multiple common selectors for recipe data
      const name = 
        $('h1').first().text().trim() ||
        $('[class*="title"]').first().text().trim() ||
        'Untitled Recipe';

      // Try multiple selectors for ingredients
      const rawIngredients = new Set([
        ...$('[class*="ingredient"]').map((_, el) => $(el).text().trim()).get(),
        ...$('li:contains("cup"), li:contains("tablespoon"), li:contains("teaspoon"), li:contains("pound")').map((_, el) => $(el).text().trim()).get(),
        ...$('li:contains("oz"), li:contains("ounce"), li:contains("gram")').map((_, el) => $(el).text().trim()).get()
      ]);

      // Clean up ingredients
      const ingredients = [...rawIngredients]
        .filter(Boolean) // Remove empty strings
        .filter(ingredient => {
          // Remove single words or very short strings that are likely fragments
          const words = ingredient.split(/\s+/);
          return words.length > 1 && ingredient.length > 3;
        })
        .map(ingredient => {
          return ingredient
            .replace(/[□■]/g, '') // Remove box characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .replace(/(\d+)\.(\d+)\.(\d+)/g, (_: string, p1: string, p2: string, p3: string) => `${p1}.${p2}`) // Fix double decimals
            .replace(/(\d+)\/(\d+)\.(\d+)/g, '$1/$2') // Fix fraction decimals
            .replace(/(\d+\.\d+)%/g, '') // Remove percentage signs
            .replace(/\b(or|such as|like)\b.*$/, '') // Remove alternative suggestions
            .replace(/\([^)]*\)/g, '') // Remove parentheticals
            .replace(/,.+$/, '') // Remove everything after commas
            .replace(/\s+/g, ' ') // Normalize spaces again
            .trim();
        })
        .filter(ingredient => {
          // Additional filtering after cleanup
          return (
            ingredient.length > 3 && // Must be longer than 3 chars
            /\d/.test(ingredient) && // Must contain at least one number
            !/^[\d.]+$/.test(ingredient) && // Must not be just a number
            !ingredient.toLowerCase().includes('ingredients') // Must not be a header
          );
        })
        // Remove duplicates after cleaning
        .filter((ingredient, index, self) => 
          self.findIndex(i => 
            i.toLowerCase().replace(/\s+/g, '') === 
            ingredient.toLowerCase().replace(/\s+/g, '')
          ) === index
        );

      // Try multiple selectors for instructions
      const instructions = [
        ...$('[class*="instruction"], [class*="direction"]').map((_, el) => $(el).text().trim()).get(),
        ...$('ol li, [class*="steps"] li').map((_, el) => $(el).text().trim()).get()
      ]
        .filter(Boolean)
        .map(instruction => 
          instruction
            .replace(/\s+/g, ' ')
            .trim()
        )
        // Remove duplicates
        .filter((instruction, index, self) => 
          self.indexOf(instruction) === index
        );

      // Try to find servings
      const servingsText = $('[class*="yield"], [class*="serving"]').text();
      const servingsMatch = servingsText.match(/\d+/);
      const servings = servingsMatch ? parseInt(servingsMatch[0]) : 1;

      // Try to find image
      const image = 
        $('img[class*="recipe"], img[class*="hero"], [class*="featured-image"] img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content');

      return {
        name,
        ingredients: ingredients.length ? ingredients : [],
        instructions: instructions.length ? instructions : [],
        servings,
        image
      };
    } catch (error) {
      console.error('Error scraping recipe:', error);
      throw new Error('Failed to scrape recipe. Please check the URL and try again.');
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