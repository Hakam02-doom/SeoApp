import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { z } from 'zod';

const updateIntegrationSchema = z.object({
  credentials: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/integrations/[id] - Get a single integration
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    const integration = await db.integration.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!integration || integration.project.userId !== userId) {
      throw new APIError(404, 'Integration not found', ErrorCode.NOT_FOUND);
    }

    return successResponse({ integration });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH /api/integrations/[id] - Update an integration
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

    const validated = updateIntegrationSchema.parse(body);

    // Verify integration belongs to user's project
    const existing = await db.integration.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Integration not found', ErrorCode.NOT_FOUND);
    }

    const updateData: {
      credentials?: any;
      isActive?: boolean;
      lastSyncAt?: Date;
    } = {};
    
    if (validated.credentials !== undefined) {
      // Merge credentials instead of replacing
      const existingCredentials = (existing.credentials as any) || {};
      updateData.credentials = {
        ...existingCredentials,
        ...validated.credentials,
      };
    }
    
    if (validated.isActive !== undefined) {
      updateData.isActive = validated.isActive;
      if (validated.isActive) {
        updateData.lastSyncAt = new Date();
      }
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return successResponse({ integration: existing });
    }

    const integration = await db.integration.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ integration });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE /api/integrations/[id] - Delete an integration
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    // Verify integration belongs to user's project
    const existing = await db.integration.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Integration not found', ErrorCode.NOT_FOUND);
    }

    await db.integration.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}

