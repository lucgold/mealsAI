declare module 'recipe-scraper' {
  interface ScrapedRecipe {
    name: string;
    ingredients: string[];
    instructions: string[];
    servings?: number;
    image?: string;
    url: string;
    time?: {
      prep: string;
      cook: string;
      total: string;
    };
  }

  function recipeScraper(url: string): Promise<ScrapedRecipe>;
  export = recipeScraper;
} 