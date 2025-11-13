import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { z } from 'zod';

const updateBacklinkSchema = z.object({
  fromUrl: z.string().url().optional(),
  toUrl: z.string().url().optional(),
  anchorText: z.string().optional(),
  status: z.enum(['pending', 'published', 'rejected']).optional(),
});

// GET /api/backlinks/[id] - Get a single backlink
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    const backlink = await db.backlink.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!backlink || backlink.project.userId !== userId) {
      throw new APIError(404, 'Backlink not found', ErrorCode.NOT_FOUND);
    }

    return successResponse({ backlink });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH /api/backlinks/[id] - Update a backlink
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;
    const body = await req.json();

    const validated = updateBacklinkSchema.parse(body);

    // Verify backlink belongs to user's project
    const existing = await db.backlink.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Backlink not found', ErrorCode.NOT_FOUND);
    }

    const backlink = await db.backlink.update({
      where: { id },
      data: validated,
    });

    return successResponse({ backlink });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE /api/backlinks/[id] - Delete a backlink
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    // Verify backlink belongs to user's project
    const existing = await db.backlink.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Backlink not found', ErrorCode.NOT_FOUND);
    }

    await db.backlink.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}

