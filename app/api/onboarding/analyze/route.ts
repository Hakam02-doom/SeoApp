import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { analyzeWebsite } from '@/lib/services/website-analyzer';
import { analyzeWebsiteWithAI } from '@/lib/services/ai-website-analyzer';
import { z } from 'zod';

const analyzeSchema = z.object({
  websiteUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).optional(),
});

// POST /api/onboarding/analyze - Analyze website and create project
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = analyzeSchema.parse(body);

    // Analyze the main website (includes competitor analysis if provided)
    console.log('[Onboarding] ========================================');
    console.log('[Onboarding] NEW ANALYSIS REQUEST');
    console.log('[Onboarding] User ID:', userId);
    console.log('[Onboarding] Website URL:', validated.websiteUrl);
    console.log('[Onboarding] Competitor URLs:', validated.competitorUrls);
    console.log('[Onboarding] Scraper API key configured:', !!process.env.SCRAPER_API_KEY);
    console.log('[Onboarding] ========================================');
    
    let analysis;
    try {
      analysis = await analyzeWebsite(
        validated.websiteUrl,
        validated.competitorUrls
      );
    } catch (error: any) {
      console.error('[Onboarding] Website analysis failed:', error);
      console.error('[Onboarding] Error message:', error?.message);
      console.error('[Onboarding] Error stack:', error?.stack);
      // Re-throw with more context
      throw new Error(error?.message || 'Failed to analyze website. Please check your Scraper API key and try again.');
    }

    // Use keywords from analysis
    const keywords = analysis.keywords || [];

    // Analyze website with AI to generate description and features
    let aiAnalysis = null;
    try {
      console.log('[Onboarding] Analyzing website with AI...');
      aiAnalysis = await analyzeWebsiteWithAI(
        validated.websiteUrl,
        undefined, // We could pass HTML content here if needed
        {
          title: analysis.seo?.title || null,
          metaDescription: analysis.seo?.metaDescription || null,
          h1: undefined, // Could extract from HTML if needed
        }
      );
      console.log('[Onboarding] AI analysis completed:', {
        hasCoreBusiness: !!aiAnalysis.coreBusiness,
        featuresCount: aiAnalysis.keyFeatures?.length || 0,
        hasDescription: !!aiAnalysis.description,
      });
    } catch (error: any) {
      console.error('[Onboarding] AI analysis failed (continuing without it):', error?.message);
      // Continue without AI analysis - it's optional
    }

    // Create project with analysis data
    const projectName = analysis.seo?.title
      ? analysis.seo.title.split(' ').slice(0, 5).join(' ')
      : new URL(validated.websiteUrl).hostname.replace('www.', '');

    console.log('[Onboarding] Creating new project with data:', {
      name: projectName,
      websiteUrl: validated.websiteUrl,
      hasBrandAnalysis: !!analysis.brand,
      hasSeoAnalysis: !!analysis.seo,
      hasCompetitors: !!analysis.competitors,
      hasAIAnalysis: !!aiAnalysis,
      seoTitle: analysis.seo?.title,
    });

    // Store AI analysis in brandVoice or a new field
    const project = await db.project.create({
      data: {
        userId,
        name: projectName,
        websiteUrl: validated.websiteUrl,
        brandAnalysis: (analysis.brand || undefined) as any,
        seoAnalysis: (analysis.seo || undefined) as any,
        competitorData: (analysis.competitors && analysis.competitors.length > 0 
          ? analysis.competitors 
          : undefined) as any,
        brandVoice: aiAnalysis ? {
          coreBusiness: aiAnalysis.coreBusiness,
          keyFeatures: aiAnalysis.keyFeatures,
          description: aiAnalysis.description,
          targetAudience: aiAnalysis.targetAudience,
        } : undefined,
        onboardingComplete: true,
      },
    });

    console.log('[Onboarding] Project created:', {
      id: project.id,
      websiteUrl: project.websiteUrl,
      name: project.name,
      createdAt: project.createdAt,
    });

    // Import keywords
    if (keywords.length > 0) {
      await db.keyword.createMany({
        data: keywords.map((keyword) => ({
          projectId: project.id,
          keyword,
          status: 'unplanned',
        })),
        skipDuplicates: true,
      });
    }

    // Fetch the created project with keywords
    const projectWithKeywords = await db.project.findUnique({
      where: { id: project.id },
      include: {
        keywords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return successResponse(
      {
        project: projectWithKeywords,
        analysis: {
          brand: analysis.brand,
          seo: analysis.seo,
          keywords: analysis.keywords,
          competitors: analysis.competitors,
        },
        aiAnalysis: aiAnalysis || undefined,
        keywordsImported: keywords.length,
      },
      201
    );
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return handleAPIError(error);
  }
}

