import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { generateArticle } from '@/lib/services/article-generator';
import { analyzeSEO } from '@/lib/services/seo-analyzer';
import { z } from 'zod';

const generateArticleSchema = z.object({
  projectId: z.string(),
  keywordId: z.string().optional(),
  keyword: z.string().optional(),
  targetWordCount: z.number().optional().default(2000),
});

// POST /api/articles/generate - Generate an article
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { userId } = auth;
    const body = await req.json();

    const validated = generateArticleSchema.parse(body);

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: { id: validated.projectId, userId },
      include: {
        articles: {
          select: { title: true },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new APIError(404, 'Project not found', ErrorCode.NOT_FOUND);
    }

    // Get keyword if keywordId provided
    let keyword: string | undefined;
    let keywordRecord = null;

    if (validated.keywordId) {
      keywordRecord = await db.keyword.findFirst({
        where: {
          id: validated.keywordId,
          projectId: validated.projectId,
        },
      });

      if (!keywordRecord) {
        throw new APIError(404, 'Keyword not found', ErrorCode.NOT_FOUND);
      }

      keyword = keywordRecord.keyword;
    } else if (validated.keyword) {
      keyword = validated.keyword;
    } else {
      throw new APIError(400, 'Either keywordId or keyword is required', ErrorCode.MISSING_KEYWORD);
    }

    if (!keyword) {
      throw new APIError(400, 'Keyword is required', ErrorCode.MISSING_KEYWORD);
    }

    // Get existing article titles for internal linking
    const existingArticles = project.articles.map((a) => a.title);

    // Generate article using OpenAI
    console.log(`[Article Generation] Generating article for keyword: ${keyword}`);
    const generated = await generateArticle({
      keyword,
      projectName: project.name,
      websiteUrl: project.websiteUrl,
      language: project.language,
      brandVoice: project.brandVoice as any,
      targetWordCount: validated.targetWordCount,
      existingArticles,
    });

    // Analyze SEO
    const seoAnalysis = analyzeSEO(
      generated.content,
      generated.metaTitle || generated.title,
      generated.metaDescription || '',
      keyword
    );

    // Calculate metrics
    const wordCount = generated.wordCount;
    const headingCount = generated.headings.length;
    const paragraphCount = generated.content.split(/\n\n/).filter((p) => p.trim().length > 0).length;

    // Create article in database
    const article = await db.article.create({
      data: {
        projectId: validated.projectId,
        keywordId: keywordRecord?.id,
        title: generated.title,
        content: generated.content,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        status: 'draft',
        wordCount,
        headingCount,
        paragraphCount,
        seoScore: seoAnalysis.score,
        keywordDensity: seoAnalysis.keywordDensity,
        internalLinks: seoAnalysis.internalLinks,
        externalLinks: seoAnalysis.externalLinks,
      },
    });

    // Mark keyword as used if keywordId was provided
    if (keywordRecord) {
      await db.keyword.update({
        where: { id: keywordRecord.id },
        data: { status: 'used' },
      });
    }

    return successResponse(
      {
        article,
        seoAnalysis,
      },
      201
    );
  } catch (error: any) {
    console.error('[Article Generation] Error:', error);
    console.error('[Article Generation] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Always return JSON, never HTML
    try {
      if (error instanceof APIError) {
        return handleAPIError(error);
      }
      
      // Handle OpenAI errors specifically
      if (error?.message?.includes('OpenAI') || error?.code === 'invalid_api_key' || error?.code === 'insufficient_quota' || error?.code === 'rate_limit_exceeded') {
        return NextResponse.json(
          {
            error: error.message || 'Failed to generate article. Please check your OpenAI API key.',
            code: 'GENERATION_FAILED',
          },
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      // Handle validation errors
      if (error?.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      return handleAPIError(error);
    } catch (handlerError: any) {
      // Fallback if error handler itself fails
      console.error('[Article Generation] Error handler failed:', handlerError);
      return NextResponse.json(
        {
          error: 'An unexpected error occurred while generating the article',
          code: 'INTERNAL_ERROR',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
}

