/**
 * Background images for blog posts using Unsplash API
 */

const UNSPLASH_ACCESS_KEY = 'hXOzBcR31zFmjTaaHVUo2xRWBP08sNjP03tMZ7rqLQI';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Default background gradient options (fallback)
const DEFAULT_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

interface GenerateImageOptions {
  title: string;
  description?: string;
  keyword?: string;
  style?: 'abstract' | 'realistic' | 'minimal' | 'gradient' | 'neon-banana';
}

/**
 * Fetch image from Unsplash based on search query
 */
async function fetchUnsplashImage(query: string): Promise<string | null> {
  try {
    const searchQuery = encodeURIComponent(query);
    // Request high quality images with landscape orientation
    const url = `${UNSPLASH_API_URL}/search/photos?query=${searchQuery}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Unsplash] API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the raw URL for highest quality
      let imageUrl = data.results[0].urls?.raw || data.results[0].urls?.full || data.results[0].urls?.regular;
      
      if (imageUrl) {
        // Add 4K dimensions to the URL (3840x2160)
        // Unsplash allows adding w and h parameters to resize images
        if (imageUrl.includes('?')) {
          imageUrl += '&w=3840&h=2160&fit=crop';
        } else {
          imageUrl += '?w=3840&h=2160&fit=crop';
        }
        return imageUrl;
      }
      
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('[Unsplash] Error fetching image:', error);
    return null;
  }
}

/**
 * Get a background image for blog post from Unsplash
 */
export async function generateBlogBackgroundImage(options: GenerateImageOptions): Promise<string | null> {
  const { title, keyword, description } = options;
  
  // Create search query from title, keyword, or description
  let searchQuery = keyword || title;
  
  // If we have a description, use first few words
  if (!keyword && description) {
    const descWords = description.split(' ').slice(0, 3).join(' ');
    searchQuery = descWords || title;
  }
  
  // Clean up the search query (remove special characters, limit length)
  searchQuery = searchQuery
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3)
    .join(' ');
  
  if (!searchQuery || searchQuery.length < 3) {
    searchQuery = 'abstract background';
  }
  
  // Try to fetch from Unsplash
  const unsplashImage = await fetchUnsplashImage(searchQuery);
  
  if (unsplashImage) {
    return unsplashImage;
  }
  
  // Fallback to default gradient
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % DEFAULT_BACKGROUNDS.length;
  return DEFAULT_BACKGROUNDS[index];
}

/**
 * Generate a default gradient CSS background based on article content
 */
export function generateGradientFromContent(title: string, keyword?: string): string {
  // Use default backgrounds
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % DEFAULT_BACKGROUNDS.length;
  return DEFAULT_BACKGROUNDS[index];
}
