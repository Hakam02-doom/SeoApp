import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { generateKeywordPlan } from '@/lib/services/keyword-plan-generator';
import { z } from 'zod';

const generatePlanSchema = z.object({
  projectId: z.string(),
  replaceExisting: z.boolean().default(false), // If true, removes existing planned keywords
});

// POST /api/keywords/generate-plan - Generate a 30-day keyword plan
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = generatePlanSchema.parse(body);

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: { id: validated.projectId, userId },
      include: {
        keywords: {
          where: {
            status: { in: ['unplanned', 'planned'] },
          },
          select: {
            keyword: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get existing keywords to avoid duplicates
    const existingKeywords = project.keywords.map((k) => k.keyword);

    // Prepare options for keyword plan generator
    const seoAnalysis = project.seoAnalysis as any;
    const competitorData = (project.competitorData as any) || [];

    console.log('[Keyword Plan API] Generating plan:', {
      projectId: validated.projectId,
      projectName: project.name,
      websiteUrl: project.websiteUrl,
      existingKeywordsCount: existingKeywords.length,
      hasSeoAnalysis: !!seoAnalysis,
      hasCompetitors: competitorData.length > 0,
    });

    // Generate the keyword plan
    const plan = await generateKeywordPlan({
      projectName: project.name,
      websiteUrl: project.websiteUrl,
      seoAnalysis: seoAnalysis
        ? {
            title: seoAnalysis.title,
            metaDescription: seoAnalysis.metaDescription,
            wordCount: seoAnalysis.wordCount,
            h1Count: seoAnalysis.h1Count,
            h2Count: seoAnalysis.h2Count,
          }
        : undefined,
      existingKeywords,
      competitorData: competitorData.map((c: any) => ({
        url: c.url,
        title: c.title,
        metaDescription: c.metaDescription,
        h1: c.h1,
      })),
      language: project.language,
    });

    console.log('[Keyword Plan API] Plan generated:', {
      totalKeywords: plan.totalKeywords,
      startDate: plan.startDate,
      endDate: plan.endDate,
    });

    // If replaceExisting is true, remove existing planned keywords
    if (validated.replaceExisting) {
      await db.keyword.deleteMany({
        where: {
          projectId: validated.projectId,
          status: 'planned',
        },
      });
      console.log('[Keyword Plan API] Removed existing planned keywords');
    }

    // Create keywords in database with planned dates
    const keywordsToCreate = plan.keywords.map((k) => {
      // Calculate the actual planned date (startDate + day - 1)
      const plannedDate = new Date(plan.startDate);
      plannedDate.setDate(plannedDate.getDate() + (k.day - 1));
      plannedDate.setHours(9, 0, 0, 0); // Set to 9 AM

      return {
        projectId: validated.projectId,
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        plannedDate: plannedDate,
        status: 'planned' as const,
        starred: false,
      };
    });

    // Use createMany for better performance
    const createdKeywords = await db.keyword.createMany({
      data: keywordsToCreate,
      skipDuplicates: true, // Skip if keyword already exists
    });

    console.log('[Keyword Plan API] Created keywords:', {
      created: createdKeywords.count,
      total: keywordsToCreate.length,
    });

    // Fetch the created keywords with their IDs
    const keywords = await db.keyword.findMany({
      where: {
        projectId: validated.projectId,
        status: 'planned',
        plannedDate: {
          gte: plan.startDate,
          lte: plan.endDate,
        },
      },
      orderBy: {
        plannedDate: 'asc',
      },
    });

    return successResponse(
      {
        plan: {
          totalKeywords: plan.totalKeywords,
          startDate: plan.startDate,
          endDate: plan.endDate,
          keywordsCreated: createdKeywords.count,
        },
        keywords: keywords,
      },
      201
    );
  } catch (error) {
    console.error('[Keyword Plan API] Error:', error);
    return handleAPIError(error);
  }
}

