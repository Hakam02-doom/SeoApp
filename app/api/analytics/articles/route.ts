import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

// GET /api/analytics/articles - Get article performance analytics
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get article statistics
    const articles = await db.article.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        seoScore: true,
        wordCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalArticles = articles.length;
    const publishedArticles = articles.filter((a) => a.status === 'published').length;
    const draftArticles = articles.filter((a) => a.status === 'draft').length;
    const scheduledArticles = articles.filter((a) => a.status === 'scheduled').length;
    const avgSeoScore = articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.seoScore || 0), 0) / articles.length)
      : 0;
    const avgWordCount = articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.wordCount || 0), 0) / articles.length)
      : 0;

    // Get top keywords
    const topKeywords = await db.keyword.findMany({
      where: { projectId },
      orderBy: { searchVolume: 'desc' },
      take: 10,
      select: {
        keyword: true,
        searchVolume: true,
        difficulty: true,
      },
    });

    // Recent articles (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentArticlesList = articles
      .filter((a) => a.createdAt >= thirtyDaysAgo)
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        seoScore: a.seoScore,
        createdAt: a.createdAt.toISOString(),
      }));

    // Get keywords count
    const keywordsCount = await db.keyword.count({
      where: { projectId },
    });

    // Get backlinks count
    const backlinksCount = await db.backlink.count({
      where: { projectId },
    });

    return successResponse({
      totalArticles,
      publishedArticles,
      totalKeywords: keywordsCount,
      totalBacklinks: backlinksCount,
      avgSeoScore,
      trafficGrowth: 0, // TODO: Calculate from Google Search Console
      recentArticles: recentArticlesList,
      topKeywords: topKeywords.map((k) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
      })),
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

