import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const createBacklinkSchema = z.object({
  projectId: z.string(),
  fromUrl: z.string().url(),
  toUrl: z.string().url(),
  anchorText: z.string().optional(),
  status: z.enum(['pending', 'published', 'rejected']).default('pending'),
});

// GET /api/backlinks - List backlinks with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

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

    const backlinks = await db.backlink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ backlinks });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/backlinks - Create a backlink
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = createBacklinkSchema.parse(body);

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

    const backlink = await db.backlink.create({
      data: {
        projectId: validated.projectId,
        fromUrl: validated.fromUrl,
        toUrl: validated.toUrl,
        anchorText: validated.anchorText,
        status: validated.status,
      },
    });

    return successResponse({ backlink }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

