import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import crypto from 'crypto';

// POST /api/integrations/[id]/regenerate-key - Regenerate integration key
export async function POST(
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

    // Generate new integration key
    const newKey = `rk_${crypto.randomBytes(24).toString('hex')}`;

    const integration = await db.integration.update({
      where: { id },
      data: {
        integrationKey: newKey,
      },
    });

    return successResponse({ 
      integration,
      integration_key: newKey,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

