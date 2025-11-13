import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import crypto from 'crypto';

const createIntegrationSchema = z.object({
  projectId: z.string(),
  platform: z.enum(['wordpress', 'shopify', 'webflow', 'wix', 'zapier', 'make']),
  credentials: z.record(z.any()),
  isActive: z.boolean().default(false),
});

// GET /api/integrations - List integrations
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');

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

    if (platform) {
      where.platform = platform;
    }

    const integrations = await db.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose full credentials in list view
    const safeIntegrations = integrations.map((integration) => ({
      ...integration,
      credentials: integration.isActive ? integration.credentials : undefined,
    }));

    return successResponse({ integrations: safeIntegrations });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/integrations - Create an integration
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = createIntegrationSchema.parse(body);

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

    // Check if integration already exists for this project and platform
    const existing = await db.integration.findUnique({
      where: {
        projectId_platform: {
          projectId: validated.projectId,
          platform: validated.platform,
        },
      },
    });

    // Generate integration key if not exists
    const generateIntegrationKey = () => {
      return `rk_${crypto.randomBytes(24).toString('hex')}`;
    };

    if (existing) {
      // Update existing integration
      // Generate integration key if it doesn't exist
      const updateData: any = {
        credentials: validated.credentials,
        isActive: validated.isActive,
      };
      
      if (!existing.integrationKey) {
        updateData.integrationKey = generateIntegrationKey();
      }

      const integration = await db.integration.update({
        where: { id: existing.id },
        data: updateData,
      });

      return successResponse({ integration });
    }

    // Create new integration with integration key
    const integration = await db.integration.create({
      data: {
        projectId: validated.projectId,
        platform: validated.platform,
        credentials: validated.credentials,
        isActive: validated.isActive,
        integrationKey: generateIntegrationKey(),
      },
    });

    return successResponse({ integration }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

