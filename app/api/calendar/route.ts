import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

// GET /api/calendar - Get calendar data for a specific month
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');
    const year = searchParams.get('year');
    const month = searchParams.get('month'); // 0-11 (JavaScript month format)

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month are required' },
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

    // Calculate date range for the month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999); // Last day of month

    // Get planned keywords for this month
    const plannedKeywords = await db.keyword.findMany({
      where: {
        projectId,
        status: 'planned',
        plannedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        plannedDate: 'asc',
      },
    });

    // Get scheduled articles for this month
    const scheduledArticles = await db.article.findMany({
      where: {
        projectId,
        status: { in: ['scheduled', 'published'] },
        publishedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        keyword: {
          select: {
            keyword: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'asc',
      },
    });

    return successResponse({
      plannedKeywords,
      scheduledArticles,
      month: monthNum,
      year: yearNum,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

