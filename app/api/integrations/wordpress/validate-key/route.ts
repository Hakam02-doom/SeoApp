import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const validateKeySchema = z.object({
  integration_key: z.string(),
});

// POST /api/integrations/wordpress/validate-key - Validate integration key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = validateKeySchema.parse(body);

    // Find integration by key
    const integration = await db.integration.findUnique({
      where: {
        integrationKey: validated.integration_key,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid integration key' },
        { status: 401 }
      );
    }
    
    // Note: We allow validation even if integration is not active
    // This allows users to validate keys before fully connecting

    return successResponse({
      valid: true,
      integration_id: integration.id,
      project_id: integration.projectId,
      project_name: integration.project.name,
      platform: integration.platform,
      is_active: integration.isActive,
    });
  } catch (error) {
    console.error('[WordPress] Validate key error:', error);
    return handleAPIError(error);
  }
}

// GET /api/integrations/wordpress/validate-key - Validate integration key from header
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('X-Integration-Key') || req.headers.get('Authorization');
    
    let integrationKey = '';
    
    if (authHeader?.startsWith('Bearer ')) {
      integrationKey = authHeader.substring(7);
    } else if (authHeader) {
      integrationKey = authHeader;
    } else {
      // Try query parameter
      const { searchParams } = new URL(req.url);
      integrationKey = searchParams.get('key') || '';
    }

    if (!integrationKey) {
      return NextResponse.json(
        { error: 'Integration key is required' },
        { status: 401 }
      );
    }

    // Find integration by key
    const integration = await db.integration.findUnique({
      where: {
        integrationKey: integrationKey,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid integration key' },
        { status: 401 }
      );
    }
    
    // Note: We allow validation even if integration is not active
    // This allows users to validate keys before fully connecting

    return successResponse({
      valid: true,
      integration_id: integration.id,
      project_id: integration.projectId,
      project_name: integration.project.name,
      platform: integration.platform,
      is_active: integration.isActive,
    });
  } catch (error) {
    console.error('[WordPress] Validate key error:', error);
    return handleAPIError(error);
  }
}

