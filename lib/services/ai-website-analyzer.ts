import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set - AI website analysis will not work');
} else {
  console.log('OpenAI API key configured - AI website analysis enabled');
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface AIWebsiteAnalysis {
  coreBusiness: string;
  keyFeatures: string[];
  description: string;
  targetAudience?: {
    primaryAudience: string;
    businessNeeds: string[];
    technicalProficiency: string;
    painPoints: string[];
    goals: string[];
  };
}

/**
 * Analyze website using AI to generate business description and features
 */
export async function analyzeWebsiteWithAI(
  websiteUrl: string,
  websiteContent?: string,
  seoData?: {
    title?: string | null;
    metaDescription?: string | null;
    h1?: string | null;
  }
): Promise<AIWebsiteAnalysis> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.');
  }

  // Build context from available data
  const context = `
Website URL: ${websiteUrl}
${seoData?.title ? `Page Title: ${seoData.title}` : ''}
${seoData?.metaDescription ? `Meta Description: ${seoData.metaDescription}` : ''}
${seoData?.h1 ? `Main Heading: ${seoData.h1}` : ''}
${websiteContent ? `\nWebsite Content (first 2000 chars):\n${websiteContent.substring(0, 2000)}` : ''}
`;

  const prompt = `Analyze this website and provide a comprehensive business description and key features.

${context}

Based on the website information provided, generate:

1. **Core Business**: A 2-3 sentence description of what the business/platform does, its primary purpose, and who it serves.

2. **Key Features**: A list of 5-10 key features or capabilities of the platform/service. Each feature should be:
   - Specific and actionable
   - Highlighting unique value propositions
   - Written in a clear, benefit-focused way
   - Starting with a feature name followed by a brief description

3. **Description**: A comprehensive 1-2 paragraph description that expands on the core business, explaining the problem it solves, how it works, and its main benefits.

4. **Target Audience**: A detailed analysis of who the business serves, including:
   - Primary Audience: Who are the main customers/users? (roles, company sizes, characteristics)
   - Business Needs: What specific needs or desires does the target audience have?
   - Technical Proficiency: What is their technical skill level and preferences?
   - Pain Points: What specific problems or challenges do they face?
   - Goals: What objectives or outcomes are they trying to achieve?

Return the response as a JSON object with this structure:
{
  "coreBusiness": "Brief 2-3 sentence description of the business",
  "keyFeatures": [
    "Feature Name: Detailed description of what this feature does and its benefits",
    ...
  ],
  "description": "Comprehensive 1-2 paragraph description of the business, its purpose, and how it helps users",
  "targetAudience": {
    "primaryAudience": "Detailed description of who the primary target customers are, their roles, company sizes, and characteristics",
    "businessNeeds": [
      "Specific need or desire of the target audience",
      ...
    ],
    "technicalProficiency": "Description of the target audience's technical skill level and preferences",
    "painPoints": [
      "Specific problem or challenge the target audience faces",
      ...
    ],
    "goals": [
      "Specific objective or outcome the target audience wants to achieve",
      ...
    ]
  }
}

Be specific, accurate, and focus on what makes this business unique and valuable.`;

  try {
    console.log('[AI Website Analyzer] Analyzing website with OpenAI:', {
      websiteUrl,
      hasContent: !!websiteContent,
      hasSeoData: !!seoData,
      model: 'gpt-4o',
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert business analyst and copywriter. You analyze websites and create accurate, compelling descriptions of businesses and their features. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    console.log('[AI Website Analyzer] OpenAI response received:', {
      model: completion.model,
      usage: completion.usage,
      hasContent: !!completion.choices[0]?.message?.content,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(response) as AIWebsiteAnalysis;

    // Validate and clean the response
    return {
      coreBusiness: analysis.coreBusiness || 'A business platform that helps users achieve their goals.',
      keyFeatures: Array.isArray(analysis.keyFeatures)
        ? analysis.keyFeatures.filter((f) => f && f.trim().length > 0)
        : [],
      description: analysis.description || analysis.coreBusiness || '',
      targetAudience: analysis.targetAudience ? {
        primaryAudience: analysis.targetAudience.primaryAudience || '',
        businessNeeds: Array.isArray(analysis.targetAudience.businessNeeds)
          ? analysis.targetAudience.businessNeeds.filter((n) => n && n.trim().length > 0)
          : [],
        technicalProficiency: analysis.targetAudience.technicalProficiency || '',
        painPoints: Array.isArray(analysis.targetAudience.painPoints)
          ? analysis.targetAudience.painPoints.filter((p) => p && p.trim().length > 0)
          : [],
        goals: Array.isArray(analysis.targetAudience.goals)
          ? analysis.targetAudience.goals.filter((g) => g && g.trim().length > 0)
          : [],
      } : undefined,
    };
  } catch (error: any) {
    console.error('[AI Website Analyzer] Error:', error);
    if (error.message?.includes('JSON')) {
      throw new Error('Failed to parse website analysis from OpenAI. Please try again.');
    }
    throw new Error(
      error.message || 'Failed to analyze website with AI. Please check your OpenAI API key.'
    );
  }
}

