import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const createKeywordSchema = z.object({
  projectId: z.string(),
  keyword: z.string().min(1),
  searchVolume: z.number().optional(),
  difficulty: z.number().optional(),
  plannedDate: z.string().datetime().optional(),
  status: z.enum(['unplanned', 'planned', 'used']).default('unplanned'),
  starred: z.boolean().default(false),
});

// GET /api/keywords - List keywords with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const starred = searchParams.get('starred');
    const search = searchParams.get('search');

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

    const where: any = {
      projectId,
    };

    if (status) {
      where.status = status;
    }

    if (starred === 'true') {
      where.starred = true;
    }

    if (search) {
      where.keyword = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const keywords = await db.keyword.findMany({
      where,
      include: {
        articles: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { starred: 'desc' },
        { plannedDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return successResponse({ keywords });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/keywords - Create a keyword
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = createKeywordSchema.parse(body);

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

    const keyword = await db.keyword.create({
      data: {
        projectId: validated.projectId,
        keyword: validated.keyword,
        searchVolume: validated.searchVolume,
        difficulty: validated.difficulty,
        plannedDate: validated.plannedDate ? new Date(validated.plannedDate) : undefined,
        status: validated.status,
        starred: validated.starred,
      },
    });

    return successResponse({ keyword }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

