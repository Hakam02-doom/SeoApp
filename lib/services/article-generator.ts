import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set - article generation will not work');
} else {
  console.log('OpenAI API key configured - article generation enabled');
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface ArticleGenerationOptions {
  keyword: string;
  projectName: string;
  websiteUrl: string;
  language?: string;
  brandVoice?: Record<string, any>;
  targetWordCount?: number;
  existingArticles?: string[]; // For internal linking
}

export interface GeneratedArticle {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  headings: string[];
  wordCount: number;
}

export async function generateArticle(
  options: ArticleGenerationOptions
): Promise<GeneratedArticle> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    keyword,
    projectName,
    websiteUrl,
    language = 'en',
    targetWordCount = 2000,
    existingArticles = [],
  } = options;

  // Build prompt for SEO-optimized article
  const prompt = `Write a comprehensive, SEO-optimized article about "${keyword}" for ${projectName} (${websiteUrl}).

Requirements:
- Target word count: ${targetWordCount} words
- Language: ${language}
- Include H1, H2, and H3 headings
- Write in a professional, engaging tone
- Include relevant examples and practical advice
- Optimize for search engines while maintaining readability
- Include internal linking opportunities (mention these in the content)

${existingArticles.length > 0 ? `\nConsider linking to these existing articles: ${existingArticles.join(', ')}` : ''}

Format the response as JSON with this structure:
{
  "title": "Main article title (H1)",
  "content": "Full article content with markdown formatting",
  "metaTitle": "SEO meta title (50-60 characters)",
  "metaDescription": "SEO meta description (150-160 characters)",
  "headings": ["H2 heading 1", "H2 heading 2", ...]
}`;

  try {
    console.log('[Article Generator] Generating article with OpenAI:', {
      keyword,
      projectName,
      targetWordCount,
      model: 'gpt-4o', // Updated to use gpt-4o (latest model)
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Updated from 'gpt-4-turbo-preview' to 'gpt-4o' (latest and more cost-effective)
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO content writer. Create high-quality, SEO-optimized articles that rank well in search engines while providing value to readers. Always return valid JSON.',
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

    console.log('[Article Generator] OpenAI response received:', {
      model: completion.model,
      usage: completion.usage,
      hasContent: !!completion.choices[0]?.message?.content,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const articleData = JSON.parse(response) as GeneratedArticle;

    // Validate and clean the response
    return {
      title: articleData.title || keyword,
      content: articleData.content || '',
      metaTitle: articleData.metaTitle || articleData.title || keyword,
      metaDescription:
        articleData.metaDescription || `Learn about ${keyword} and more.`,
      headings: articleData.headings || [],
      wordCount: articleData.content?.split(/\s+/).length || 0,
    };
  } catch (error: any) {
    console.error('[Article Generator] Error:', error);
    console.error('[Article Generator] Error message:', error?.message);
    console.error('[Article Generator] Error code:', error?.code);
    console.error('[Article Generator] Error type:', error?.type);
    
    // Provide more specific error messages
    if (error?.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
    }
    if (error?.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing.');
    }
    if (error?.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
    }
    if (error?.message?.includes('JSON')) {
      throw new Error('Failed to parse article response. Please try again.');
    }
    
    throw new Error(error?.message || 'Failed to generate article. Please try again.');
  }
}
