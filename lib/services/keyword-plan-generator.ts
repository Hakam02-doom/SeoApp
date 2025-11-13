import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set - keyword plan generation will not work');
} else {
  console.log('OpenAI API key configured - keyword plan generation enabled');
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface KeywordPlanOptions {
  projectName: string;
  websiteUrl: string;
  seoAnalysis?: {
    title?: string | null;
    metaDescription?: string | null;
    wordCount?: number;
    h1Count?: number;
    h2Count?: number;
  } | null;
  existingKeywords?: string[];
  competitorData?: Array<{
    url: string;
    title?: string | null;
    metaDescription?: string | null;
    h1?: string | null;
  }>;
  language?: string;
}

export interface KeywordPlanItem {
  keyword: string;
  searchVolume: number; // Estimated
  difficulty: number; // 0-100
  day: number; // 1-30
  category: string; // Service category
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  reasoning: string; // Why this keyword is relevant
}

export interface KeywordPlan {
  keywords: KeywordPlanItem[];
  totalKeywords: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Generate a 30-day keyword plan based on project services and SEO data
 */
export async function generateKeywordPlan(
  options: KeywordPlanOptions
): Promise<KeywordPlan> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.');
  }

  const {
    projectName,
    websiteUrl,
    seoAnalysis,
    existingKeywords = [],
    competitorData = [],
    language = 'en',
  } = options;

  // Build context from SEO analysis
  const websiteContext = `
Website: ${websiteUrl}
Project Name: ${projectName}
Title: ${seoAnalysis?.title || 'N/A'}
Meta Description: ${seoAnalysis?.metaDescription || 'N/A'}
Content Word Count: ${seoAnalysis?.wordCount || 0}
H1 Headings: ${seoAnalysis?.h1Count || 0}
H2 Headings: ${seoAnalysis?.h2Count || 0}
`;

  // Build competitor context
  const competitorContext =
    competitorData.length > 0
      ? `
Competitors:
${competitorData
  .map(
    (c, i) => `
${i + 1}. ${c.url}
   Title: ${c.title || 'N/A'}
   Description: ${c.metaDescription || 'N/A'}
   H1: ${c.h1 || 'N/A'}
`
  )
  .join('\n')}
`
      : '';

  // Build existing keywords context
  const existingKeywordsContext =
    existingKeywords.length > 0
      ? `
Existing Keywords (avoid duplicates):
${existingKeywords.slice(0, 20).join(', ')}
`
      : '';

  // Create prompt for OpenAI
  const prompt = `You are an expert SEO strategist. Generate a comprehensive 30-day keyword plan for a website.

${websiteContext}
${competitorContext}
${existingKeywordsContext}

Requirements:
1. Generate 30-60 high-quality keywords that are:
   - Directly related to the website's services and offerings
   - SEO-friendly (good search volume potential, reasonable difficulty)
   - Varied in intent (informational, commercial, transactional)
   - Distributed across different service categories
   - Not duplicates of existing keywords

2. Distribute keywords across 30 days (1-3 keywords per day)
   - Start with easier, high-volume keywords (days 1-10)
   - Progress to medium difficulty keywords (days 11-20)
   - Include more competitive, high-value keywords (days 21-30)

3. For each keyword, provide:
   - keyword: The actual keyword phrase
   - searchVolume: Estimated monthly search volume (100-10000)
   - difficulty: SEO difficulty score (0-100, where 0-30 is easy, 31-60 is medium, 61-100 is hard)
   - day: Which day (1-30) this keyword should be targeted
   - category: Service category (e.g., "Main Service", "Supporting Service", "Blog Content", "Product Features")
   - intent: Search intent type (informational, commercial, transactional, navigational)
   - reasoning: Brief explanation of why this keyword is relevant and valuable

4. Prioritize keywords that:
   - Match the website's main services
   - Have commercial or transactional intent (higher conversion potential)
   - Are related to competitor content
   - Fill content gaps

5. Ensure variety:
   - Mix short-tail and long-tail keywords
   - Include question-based keywords (how, what, why, best, etc.)
   - Include location-based keywords if relevant
   - Include comparison keywords (vs, alternative, etc.)

Return the response as a JSON object with this structure:
{
  "keywords": [
    {
      "keyword": "example keyword phrase",
      "searchVolume": 1000,
      "difficulty": 45,
      "day": 1,
      "category": "Main Service",
      "intent": "commercial",
      "reasoning": "This keyword targets users looking for the main service offered"
    },
    ...
  ]
}

Generate 30-60 keywords total, distributed across 30 days.`;

  try {
    console.log('[Keyword Plan Generator] Generating plan with OpenAI:', {
      projectName,
      websiteUrl,
      hasSeoAnalysis: !!seoAnalysis,
      hasCompetitors: competitorData.length > 0,
      existingKeywordsCount: existingKeywords.length,
      model: 'gpt-4o',
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO strategist specializing in keyword research and content planning. You create data-driven keyword plans that help websites rank higher in search engines. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    console.log('[Keyword Plan Generator] OpenAI response received:', {
      model: completion.model,
      usage: completion.usage,
      hasContent: !!completion.choices[0]?.message?.content,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const planData = JSON.parse(response) as { keywords: KeywordPlanItem[] };

    // Validate and clean the response
    if (!planData.keywords || !Array.isArray(planData.keywords)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Ensure all keywords have valid data
    const validatedKeywords = planData.keywords
      .filter((k) => k.keyword && k.keyword.trim().length > 0)
      .map((k) => ({
        keyword: k.keyword.trim(),
        searchVolume: Math.max(100, Math.min(10000, k.searchVolume || 500)),
        difficulty: Math.max(0, Math.min(100, k.difficulty || 50)),
        day: Math.max(1, Math.min(30, k.day || 1)),
        category: k.category || 'General',
        intent: k.intent || 'informational',
        reasoning: k.reasoning || 'Relevant keyword for SEO',
      }))
      .slice(0, 60); // Limit to 60 keywords max

    // Calculate start and end dates
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 29); // 30 days total

    return {
      keywords: validatedKeywords,
      totalKeywords: validatedKeywords.length,
      startDate,
      endDate,
    };
  } catch (error: any) {
    console.error('[Keyword Plan Generator] Error:', error);
    if (error.message?.includes('JSON')) {
      throw new Error('Failed to parse keyword plan from OpenAI. Please try again.');
    }
    throw new Error(
      error.message || 'Failed to generate keyword plan. Please check your OpenAI API key.'
    );
  }
}

