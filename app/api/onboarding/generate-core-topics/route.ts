import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const generateCoreTopicsSchema = z.object({
  projectId: z.string(),
});

// POST /api/onboarding/generate-core-topics - Generate core topics for a project
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = generateCoreTopicsSchema.parse(body);

    // Verify project belongs to user
    const project = await db.project.findUnique({
      where: { id: validated.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get project data for context
    const brandVoice = project.brandVoice as any;
    const coreBusiness = brandVoice?.coreBusiness || '';
    const targetAudience = brandVoice?.targetAudience?.primaryAudience || '';
    const keyFeatures = brandVoice?.keyFeatures || [];

    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate core topics using AI
    const prompt = `Based on the following business information, generate 5-8 core topics that would be most valuable for SEO and content strategy. Each topic should be:
1. Broad enough to cover multiple related keywords
2. Specific enough to be actionable
3. Aligned with the business's core offerings
4. Based on real search intent

Business Information:
- Core Business: ${coreBusiness}
- Target Audience: ${targetAudience}
- Key Features: ${keyFeatures.join(', ')}

Return a JSON array of topics, each with:
- topic: The topic name (string)
- searchVolume: Estimated monthly search volume (number, 0-1000000)
- difficulty: Keyword difficulty score (number, 0-100)

Format: {"topics": [{"topic": "...", "searchVolume": ..., "difficulty": ...}, ...]}`;

    console.log('[Core Topics] Generating topics with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Generate realistic core topics with search volume and difficulty scores based on business information. Always return valid JSON.',
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

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const data = JSON.parse(response);
    const topics = data.topics || [];

    // Validate and clean topics
    const validatedTopics = topics
      .filter((t: any) => t.topic && typeof t.topic === 'string')
      .map((t: any) => ({
        topic: t.topic.trim(),
        searchVolume: typeof t.searchVolume === 'number' ? Math.max(0, Math.min(1000000, t.searchVolume)) : Math.floor(Math.random() * 10000) + 100,
        difficulty: typeof t.difficulty === 'number' ? Math.max(0, Math.min(100, t.difficulty)) : Math.floor(Math.random() * 50) + 20,
      }))
      .slice(0, 8); // Limit to 8 topics

    console.log('[Core Topics] Generated topics:', validatedTopics.length);

    // Store core topics in project (could be in a new field or in brandVoice)
    await db.project.update({
      where: { id: validated.projectId },
      data: {
        brandVoice: {
          ...(brandVoice || {}),
          coreTopics: validatedTopics,
        },
      },
    });

    return successResponse({ topics: validatedTopics });
  } catch (error) {
    console.error('[Core Topics] Error:', error);
    return handleAPIError(error);
  }
}

