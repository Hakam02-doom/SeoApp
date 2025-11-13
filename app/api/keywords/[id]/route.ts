import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { z } from 'zod';

const updateKeywordSchema = z.object({
  keyword: z.string().min(1).optional(),
  searchVolume: z.number().optional(),
  difficulty: z.number().optional(),
  plannedDate: z.string().datetime().nullable().optional(),
  status: z.enum(['unplanned', 'planned', 'used']).optional(),
  starred: z.boolean().optional(),
});

// GET /api/keywords/[id] - Get a single keyword
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    const keyword = await db.keyword.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
        articles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!keyword || keyword.project.userId !== userId) {
      throw new APIError(404, 'Keyword not found', ErrorCode.NOT_FOUND);
    }

    return successResponse({ keyword });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH /api/keywords/[id] - Update a keyword
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

    const validated = updateKeywordSchema.parse(body);

    // Verify keyword belongs to user's project
    const existing = await db.keyword.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Keyword not found', ErrorCode.NOT_FOUND);
    }

    const updateData: any = {};
    if (validated.keyword !== undefined) updateData.keyword = validated.keyword;
    if (validated.searchVolume !== undefined) updateData.searchVolume = validated.searchVolume;
    if (validated.difficulty !== undefined) updateData.difficulty = validated.difficulty;
    if (validated.plannedDate !== undefined) {
      updateData.plannedDate = validated.plannedDate ? new Date(validated.plannedDate) : null;
    }
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.starred !== undefined) updateData.starred = validated.starred;

    const keyword = await db.keyword.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ keyword });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE /api/keywords/[id] - Delete a keyword
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    // Verify keyword belongs to user's project
    const existing = await db.keyword.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Keyword not found', ErrorCode.NOT_FOUND);
    }

    await db.keyword.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}

