import axios from 'axios';
import * as cheerio from 'cheerio';

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';
const SCRAPER_API_URL = 'https://api.scraperapi.com';

interface BrandAnalysis {
  colors: string[];
  fonts: string[];
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface SEOAnalysis {
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h2Count: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  hasSchema: boolean;
  schemaTypes: string[];
}

interface CompetitorData {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  backlinks: number; // Would need separate API for this
}

/**
 * Scrape website using Scraper API
 */
export async function scrapeWebsite(url: string): Promise<string> {
  if (!SCRAPER_API_KEY) {
    console.error('[Website Analyzer] SCRAPER_API_KEY not configured');
    throw new Error('SCRAPER_API_KEY not configured. Please set SCRAPER_API_KEY in your .env file.');
  }

  try {
    console.log('[Website Analyzer] Scraping website:', url);
    console.log('[Website Analyzer] Scraper API URL:', SCRAPER_API_URL);
    console.log('[Website Analyzer] Using Scraper API key:', SCRAPER_API_KEY ? `Set (${SCRAPER_API_KEY.substring(0, 10)}...)` : 'Not set');
    
    // Build the full URL for debugging
    const requestUrl = `${SCRAPER_API_URL}?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`;
    console.log('[Website Analyzer] Request URL (without key):', `${SCRAPER_API_URL}?api_key=***&url=${encodeURIComponent(url)}&render=true`);
    
    const response = await axios.get(SCRAPER_API_URL, {
      params: {
        api_key: SCRAPER_API_KEY,
        url: url,
        render: 'true', // Render JavaScript
      },
      timeout: 60000, // Increased timeout to 60 seconds
      maxRedirects: 5,
    });

    if (!response.data) {
      throw new Error('Empty response from Scraper API');
    }

    console.log('[Website Analyzer] Successfully scraped website, content length:', response.data.length);
    return response.data;
  } catch (error: any) {
    console.error('[Website Analyzer] Scraper API error:', error);
    console.error('[Website Analyzer] Error details:', error?.message);
    console.error('[Website Analyzer] Error code:', error?.code);
    console.error('[Website Analyzer] Error response status:', error?.response?.status);
    console.error('[Website Analyzer] Error response data:', error?.response?.data);
    console.error('[Website Analyzer] Full error:', JSON.stringify(error, null, 2));
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error('Invalid Scraper API key. Please check your SCRAPER_API_KEY in .env file.');
    }
    if (error.response?.status === 403) {
      throw new Error('Scraper API access forbidden. Please check your API key permissions.');
    }
    if (error.response?.status === 429) {
      throw new Error('Scraper API rate limit exceeded. Please try again later.');
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Scraper API request timed out. The website may be too slow or unreachable.');
    }
    if (error.response?.data) {
      // Include the actual error message from Scraper API if available
      const apiError = typeof error.response.data === 'string' 
        ? error.response.data 
        : error.response.data?.message || error.response.data?.error;
      throw new Error(`Scraper API error: ${apiError || error.message || 'Unknown error'}`);
    }
    
    throw new Error(`Failed to scrape website: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyze brand elements (colors, fonts, logo)
 */
export async function analyzeBrand(html: string, baseUrl: string): Promise<BrandAnalysis> {
  const $ = cheerio.load(html);
  const colors: Set<string> = new Set();
  const fonts: Set<string> = new Set();
  let logo: string | null = null;

  // Extract colors from CSS
  const styleTags = $('style').toArray();
  const inlineStyles = $('[style]').toArray();

  // Common color patterns
  const colorPatterns = [
    /#[0-9a-fA-F]{6}/g,
    /#[0-9a-fA-F]{3}/g,
    /rgb\([^)]+\)/g,
    /rgba\([^)]+\)/g,
    /hsl\([^)]+\)/g,
  ];

  [...styleTags, ...inlineStyles].forEach((element) => {
    const styleContent = $(element).html() || $(element).attr('style') || '';
    colorPatterns.forEach((pattern) => {
      const matches = styleContent.match(pattern);
      if (matches) {
        matches.forEach((color) => colors.add(color));
      }
    });
  });

  // Extract fonts
  $('*').each((_, element) => {
    const fontFamily = $(element).css('font-family');
    if (fontFamily) {
      fontFamily.split(',').forEach((font) => {
        const cleanFont = font.trim().replace(/['"]/g, '');
        if (cleanFont) fonts.add(cleanFont);
      });
    }
  });

  // Find logo (common patterns)
  const logoSelectors = [
    'img[alt*="logo" i]',
    'img[src*="logo" i]',
    '.logo img',
    '#logo img',
    'header img[alt*="logo" i]',
    'nav img[alt*="logo" i]',
  ];

  for (const selector of logoSelectors) {
    const logoElement = $(selector).first();
    if (logoElement.length) {
      let logoUrl = logoElement.attr('src') || logoElement.attr('data-src');
      if (logoUrl) {
        if (logoUrl.startsWith('//')) {
          logoUrl = `https:${logoUrl}`;
        } else if (logoUrl.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
        } else if (!logoUrl.startsWith('http')) {
          const urlObj = new URL(baseUrl);
          logoUrl = `${urlObj.protocol}//${urlObj.host}/${logoUrl}`;
        }
        logo = logoUrl;
        break;
      }
    }
  }

  // Get primary and secondary colors (most common)
  const colorArray = Array.from(colors);
  const colorFrequency: Record<string, number> = {};
  colorArray.forEach((color) => {
    colorFrequency[color] = (colorFrequency[color] || 0) + 1;
  });

  const sortedColors = Object.entries(colorFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([color]) => color);

  return {
    colors: colorArray.slice(0, 10), // Top 10 colors
    fonts: Array.from(fonts).slice(0, 10), // Top 10 fonts
    logo: logo,
    primaryColor: sortedColors[0] || null,
    secondaryColor: sortedColors[1] || null,
  };
}

/**
 * Analyze SEO status
 */
export async function analyzeSEO(html: string): Promise<SEOAnalysis> {
  const $ = cheerio.load(html);

  const title = $('title').text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || null;

  const h1Count = $('h1').length;
  const h2Count = $('h2').length;

  const images = $('img');
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;

  images.each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt && alt.trim()) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  });

  const allLinks = $('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;

  allLinks.each((_, link) => {
    const href = $(link).attr('href');
    if (href) {
      if (href.startsWith('http') || href.startsWith('//')) {
        externalLinks++;
      } else {
        internalLinks++;
      }
    }
  });

  // Count words (approximate)
  const text = $('body').text();
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

  // Check for schema markup
  const schemaScripts = $('script[type="application/ld+json"]');
  const hasSchema = schemaScripts.length > 0;
  const schemaTypes: string[] = [];

  schemaScripts.each((_, script) => {
    try {
      const schemaContent = $(script).html();
      if (schemaContent) {
        const schema = JSON.parse(schemaContent);
        if (schema['@type']) {
          schemaTypes.push(schema['@type']);
        }
        if (schema['@context']) {
          schemaTypes.push(schema['@context']);
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  });

  return {
    title,
    metaDescription,
    h1Count,
    h2Count,
    imagesWithAlt,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    wordCount,
    hasSchema,
    schemaTypes: [...new Set(schemaTypes)],
  };
}

/**
 * Extract target keywords from content
 */
export async function extractKeywords(html: string, url: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const keywords: Set<string> = new Set();

  // Extract from title
  const title = $('title').text();
  if (title) {
    const titleWords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    titleWords.forEach((word) => keywords.add(word));
  }

  // Extract from headings
  $('h1, h2, h3').each((_, element) => {
    const text = $(element).text();
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    words.forEach((word) => keywords.add(word));
  });

  // Extract from meta keywords (if present)
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords) {
    metaKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .forEach((keyword) => keywords.add(keyword));
  }

  // Extract from URL
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0);
    pathParts.forEach((part) => {
      const words = part
        .split('-')
        .filter((w) => w.length > 3)
        .map((w) => w.toLowerCase());
      words.forEach((word) => keywords.add(word));
    });
  } catch (e) {
    // Invalid URL
  }

  return Array.from(keywords).slice(0, 50); // Top 50 keywords
}

/**
 * Analyze competitor website
 */
export async function analyzeCompetitor(competitorUrl: string): Promise<CompetitorData> {
  const html = await scrapeWebsite(competitorUrl);
  const $ = cheerio.load(html);

  const title = $('title').text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const h1 = $('h1').first().text().trim() || null;

  const text = $('body').text();
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    url: competitorUrl,
    title,
    metaDescription,
    h1,
    wordCount,
    backlinks: 0, // Would need separate API (Ahrefs, SEMrush, etc.)
  };
}

/**
 * Main website analysis function
 */
export interface WebsiteAnalysisResult {
  url: string;
  brand: BrandAnalysis;
  seo: SEOAnalysis;
  keywords: string[];
  competitors: CompetitorData[];
  analysisDate: Date;
}

export async function analyzeWebsite(
  websiteUrl: string,
  competitorUrls?: string[]
): Promise<WebsiteAnalysisResult> {
  console.log(`Analyzing website: ${websiteUrl}`);

  // Scrape main website
  const html = await scrapeWebsite(websiteUrl);

  // Analyze brand
  const brand = await analyzeBrand(html, websiteUrl);

  // Analyze SEO
  const seo = await analyzeSEO(html);

  // Extract keywords
  const keywords = await extractKeywords(html, websiteUrl);

  // Analyze competitors
  const competitors: CompetitorData[] = [];
  if (competitorUrls && competitorUrls.length > 0) {
    for (const competitorUrl of competitorUrls.slice(0, 5)) {
      // Limit to 5 competitors
      try {
        const competitorData = await analyzeCompetitor(competitorUrl);
        competitors.push(competitorData);
      } catch (error) {
        console.error(`Failed to analyze competitor: ${competitorUrl}`, error);
      }
    }
  }

  return {
    url: websiteUrl,
    brand,
    seo,
    keywords,
    competitors,
    analysisDate: new Date(),
  };
}
