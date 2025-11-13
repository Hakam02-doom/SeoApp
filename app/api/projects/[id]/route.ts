import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  websiteUrl: z.string().url().optional(),
  language: z.string().optional(),
  brandVoice: z.record(z.any()).optional(),
  onboardingComplete: z.boolean().optional(),
  brandAnalysis: z.record(z.any()).optional(),
  seoAnalysis: z.record(z.any()).optional(),
  competitorData: z.record(z.any()).optional(),
});

// GET /api/projects/[id] - Get a single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params; // Next.js 15: params is now async

    console.log('[Projects API] ========================================');
    console.log('[Projects API] Fetching project:', { id, userId });
    console.log('[Projects API] Request URL:', req.url);
    console.log('[Projects API] ========================================');

    // Use findUnique with exact ID match instead of findFirst
    const project = await db.project.findUnique({
      where: {
        id, // Exact match on ID
      },
      include: {
        keywords: {
          orderBy: { createdAt: 'desc' },
        },
        articles: {
          orderBy: { createdAt: 'desc' },
        },
        backlinks: {
          orderBy: { createdAt: 'desc' },
        },
        integrations: {
          orderBy: { createdAt: 'desc' },
        },
        settings: true,
      },
    });

    if (!project) {
      console.log('[Projects API] Project not found:', { id, userId });
      throw new APIError(404, 'Project not found', ErrorCode.NOT_FOUND);
    }

    // Verify project belongs to user
    if (project.userId !== userId) {
      console.log('[Projects API] Project belongs to different user:', {
        projectUserId: project.userId,
        requestedUserId: userId,
      });
      throw new APIError(403, 'Access denied', ErrorCode.FORBIDDEN);
    }

    console.log('[Projects API] Project found:', {
      id: project.id,
      websiteUrl: project.websiteUrl,
      name: project.name,
      userId: project.userId,
      requestedId: id,
      match: project.id === id,
    });

    // Add cache-control headers to prevent browser caching
    const response = successResponse({ project });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params; // Next.js 15: params is now async
    const body = await req.json();

    const validated = updateProjectSchema.parse(body);

    // Verify project belongs to user
    const existing = await db.project.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new APIError(404, 'Project not found', ErrorCode.NOT_FOUND);
    }

    const project = await db.project.update({
      where: { id },
      data: validated,
    });

    return successResponse({ project });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params; // Next.js 15: params is now async

    // Verify project belongs to user
    const existing = await db.project.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new APIError(404, 'Project not found', ErrorCode.NOT_FOUND);
    }

    await db.project.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}

