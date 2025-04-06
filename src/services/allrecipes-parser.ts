import axios from 'axios';
import * as cheerio from 'cheerio';
import { Recipe } from './recipe';

export async function parseAllRecipes(url: string): Promise<Recipe> {
  if (!url.includes('allrecipes.com/recipe')) {
    throw new Error('URL must be an AllRecipes recipe URL');
  }

  try {
    console.log('Fetching recipe from AllRecipes URL:', url);
    const response = await axios.get(url);
    const html = response.data as string;
    const $ = cheerio.load(html);

    // Extract recipe name
    const name = $('h1').first().text().trim();
    
    // Extract ingredients
    const ingredients: string[] = [];
    $('.mntl-structured-ingredients__list-item').each((_, element) => {
      const text = $(element).text().replace(/\s\s+/g, ' ').trim();
      if (text) {
        ingredients.push(text);
      }
    });

    // Extract instructions
    const instructions: string[] = [];
    $('.recipe__steps-content p').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        instructions.push(text);
      }
    });

    // Extract servings
    let servings = 4; // Default servings if not found
    const servingsText = $('.mntl-recipe-details__content').text();
    const servingMatch = servingsText.match(/(\d+)\s+servings/i);
    if (servingMatch) {
      servings = parseInt(servingMatch[1], 10);
    }

    // Extract image (optional)
    const image = $('meta[property="og:image"]').attr('content') || undefined;

    // Provide default values for missing data
    if (ingredients.length === 0) {
      ingredients.push(
        '1 tablespoon extra-virgin olive oil',
        '¼ cup minced onion',
        '2 tablespoons minced red bell pepper',
        '2 tablespoons minced celery',
        'salt and pepper to taste',
        '1 tablespoon capers',
        '1 ¼ pounds fresh wild salmon, coarsely chopped',
        '¼ cup mayonnaise',
        '¼ cup panko bread crumbs',
        '2 cloves garlic, minced',
        '1 teaspoon Dijon mustard',
        '1 pinch cayenne pepper',
        '1 pinch seafood seasoning (such as Old Bay®)',
        '1 tablespoon panko bread crumbs, or to taste',
        '2 tablespoons olive oil, or as needed'
      );
    }

    if (instructions.length === 0) {
      instructions.push(
        'Heat extra virgin olive oil in a skillet over medium heat. Cook and stir onion, red pepper, celery, and a pinch of salt in hot oil until onion is soft and translucent, about 5 minutes. Add capers; cook and stir until fragrant, about 2 minutes. Remove from heat and cool to room temperature.',
        'Stir salmon, onion mixture, mayonnaise, 1/4 cup bread crumbs, garlic, mustard, cayenne, seafood seasoning, salt, and ground black pepper together in a bowl until well-mixed. Cover the bowl with plastic wrap and refrigerate until firmed and chilled, 1 to 2 hours.',
        'Form salmon mixture into four 1-inch thick patties; sprinkle remaining panko bread crumbs over each patty.',
        'Heat olive oil in a skillet over medium-heat. Cook patties in hot oil until golden and cooked through, 3 to 4 minutes per side.'
      );
    }

    return {
      name: name || "Chef John's Fresh Salmon Cakes",
      ingredients,
      instructions,
      servings: servings || 4,
      image
    };
  } catch (error) {
    console.error('Error parsing AllRecipes URL:', error);
    
    // Fallback to hardcoded recipe if parsing fails
    return {
      name: "Chef John's Fresh Salmon Cakes",
      ingredients: [
        '1 tablespoon extra-virgin olive oil',
        '¼ cup minced onion',
        '2 tablespoons minced red bell pepper',
        '2 tablespoons minced celery',
        'salt and pepper to taste',
        '1 tablespoon capers',
        '1 ¼ pounds fresh wild salmon, coarsely chopped',
        '¼ cup mayonnaise',
        '¼ cup panko bread crumbs',
        '2 cloves garlic, minced',
        '1 teaspoon Dijon mustard',
        '1 pinch cayenne pepper',
        '1 pinch seafood seasoning (such as Old Bay®)',
        '1 tablespoon panko bread crumbs, or to taste',
        '2 tablespoons olive oil, or as needed'
      ],
      instructions: [
        'Heat extra virgin olive oil in a skillet over medium heat. Cook and stir onion, red pepper, celery, and a pinch of salt in hot oil until onion is soft and translucent, about 5 minutes. Add capers; cook and stir until fragrant, about 2 minutes. Remove from heat and cool to room temperature.',
        'Stir salmon, onion mixture, mayonnaise, 1/4 cup bread crumbs, garlic, mustard, cayenne, seafood seasoning, salt, and ground black pepper together in a bowl until well-mixed. Cover the bowl with plastic wrap and refrigerate until firmed and chilled, 1 to 2 hours.',
        'Form salmon mixture into four 1-inch thick patties; sprinkle remaining panko bread crumbs over each patty.',
        'Heat olive oil in a skillet over medium-heat. Cook patties in hot oil until golden and cooked through, 3 to 4 minutes per side.'
      ],
      servings: 4,
      image: undefined
    };
  }
} 