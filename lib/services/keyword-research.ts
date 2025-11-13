/**
 * Keyword Research Service
 * Integrates with keyword research APIs (Ahrefs, DataForSEO, etc.)
 */

interface KeywordResearchResult {
  keyword: string;
  searchVolume: number | null;
  difficulty: number | null;
  cpc?: number | null;
  competition?: number | null;
  trends?: number[];
}

interface KeywordResearchOptions {
  keyword: string;
  country?: string;
  language?: string;
}

/**
 * Research a keyword using available APIs
 * Falls back to mock data if API is not configured
 */
export async function researchKeyword(
  options: KeywordResearchOptions
): Promise<KeywordResearchResult> {
  const { keyword, country = 'us', language = 'en' } = options;

  // Try DataForSEO API first
  if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
    try {
      return await researchWithDataForSEO(keyword, country, language);
    } catch (error) {
      console.error('[Keyword Research] DataForSEO error:', error);
    }
  }

  // Try Ahrefs API
  if (process.env.AHREFS_API_KEY) {
    try {
      return await researchWithAhrefs(keyword, country);
    } catch (error) {
      console.error('[Keyword Research] Ahrefs error:', error);
    }
  }

  // Fallback to mock data for development
  console.warn('[Keyword Research] No API configured, using mock data');
  return {
    keyword,
    searchVolume: Math.floor(Math.random() * 10000) + 100,
    difficulty: Math.floor(Math.random() * 100),
    cpc: Math.random() * 5,
    competition: Math.random(),
  };
}

/**
 * Research keyword using DataForSEO API
 */
async function researchWithDataForSEO(
  keyword: string,
  country: string,
  language: string
): Promise<KeywordResearchResult> {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  const apiUrl = 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keywords: [keyword],
        location_code: getLocationCode(country),
        language_code: language,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.tasks?.[0]?.result?.[0];

  if (!result) {
    throw new Error('No data returned from DataForSEO');
  }

  return {
    keyword: result.keyword || keyword,
    searchVolume: result.search_volume || null,
    difficulty: null, // DataForSEO doesn't provide difficulty
    cpc: result.bid || null,
    competition: result.competition || null,
  };
}

/**
 * Research keyword using Ahrefs API
 */
async function researchWithAhrefs(
  keyword: string,
  country: string
): Promise<KeywordResearchResult> {
  const apiKey = process.env.AHREFS_API_KEY!;
  const apiUrl = `https://apiv2.ahrefs.com`;

  const response = await fetch(
    `${apiUrl}?token=${apiKey}&from=keywords_subdomains&target=${encodeURIComponent(keyword)}&mode=domain&output=json&country=${country}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Ahrefs API error: ${response.status}`);
  }

  const data = await response.json();
  const metrics = data.metrics?.[0];

  if (!metrics) {
    throw new Error('No data returned from Ahrefs');
  }

  return {
    keyword,
    searchVolume: metrics.search_volume || null,
    difficulty: metrics.keyword_difficulty || null,
    cpc: metrics.cpc || null,
    competition: null,
  };
}

/**
 * Get location code for DataForSEO
 */
function getLocationCode(country: string): number {
  const locationMap: Record<string, number> = {
    us: 2840,
    gb: 2826,
    ca: 2124,
    au: 2036,
    de: 2276,
    fr: 2508,
    es: 2724,
    it: 2380,
    nl: 2528,
    se: 2752,
    no: 2578,
    dk: 2080,
    fi: 2466,
    pl: 2616,
    br: 2076,
    mx: 2484,
    ar: 2032,
    jp: 2392,
    kr: 2410,
    cn: 2156,
    in: 2356,
  };

  return locationMap[country.toLowerCase()] || 2840; // Default to US
}

/**
 * Research multiple keywords in batch
 */
export async function researchKeywords(
  keywords: string[],
  country: string = 'us',
  language: string = 'en'
): Promise<KeywordResearchResult[]> {
  const results = await Promise.all(
    keywords.map((keyword) =>
      researchKeyword({ keyword, country, language }).catch((error) => {
        console.error(`[Keyword Research] Failed for "${keyword}":`, error);
        return {
          keyword,
          searchVolume: null,
          difficulty: null,
        };
      })
    )
  );

  return results;
}

