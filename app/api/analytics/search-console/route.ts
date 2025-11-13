import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { fetchSearchPerformance } from '@/lib/services/google-search-console';
import { z } from 'zod';

const syncSchema = z.object({
  projectId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/analytics/search-console - Sync Google Search Console data
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = syncSchema.parse(body);

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: { id: validated.projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // TODO: Get GSC credentials from project/integration
    // For now, this is a placeholder

    const startDate = validated.startDate ? new Date(validated.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = validated.endDate ? new Date(validated.endDate) : new Date();

    // Fetch search performance data
    // const metrics = await fetchSearchPerformance(project.websiteUrl, startDate, endDate);

    // For now, return mock data
    return successResponse({
      projectId: validated.projectId,
      metrics: {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
      syncedAt: new Date(),
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

// GET /api/analytics/search-console - Get search console data
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

    // TODO: Fetch actual GSC data
    // For now, return mock data

    return successResponse({
      projectId,
      metrics: {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

