import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { WordPressIntegration } from '@/lib/integrations/wordpress';
import { ShopifyIntegration } from '@/lib/integrations/shopify';
import { WebflowIntegration } from '@/lib/integrations/webflow';
import { z } from 'zod';

const publishSchema = z.object({
  integrationId: z.string().optional(),
  platform: z.enum(['wordpress', 'shopify', 'webflow']).optional(),
  credentials: z.record(z.any()).optional(),
});

// POST /api/articles/[id]/publish - Publish an article
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;
    const body = await req.json();

    const validated = publishSchema.parse(body);

    // Get article
    const article = await db.article.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
          include: {
            integrations: {
              where: validated.integrationId
                ? { id: validated.integrationId }
                : validated.platform
                ? { platform: validated.platform, isActive: true }
                : { isActive: true },
            },
          },
        },
      },
    });

    if (!article || article.project.userId !== userId) {
      throw new APIError(404, 'Article not found', ErrorCode.NOT_FOUND);
    }

    // Get integration
    let integration;
    let credentials;

    if (validated.credentials && validated.platform) {
      // Use provided credentials
      credentials = validated.credentials;
      switch (validated.platform) {
        case 'wordpress':
          integration = new WordPressIntegration();
          break;
        case 'shopify':
          integration = new ShopifyIntegration();
          break;
        case 'webflow':
          integration = new WebflowIntegration();
          break;
        default:
          throw new APIError(400, 'Unsupported platform', ErrorCode.INVALID_PLATFORM);
      }
    } else if (article.project.integrations.length > 0) {
      // Use stored integration
      const storedIntegration = article.project.integrations[0];
      credentials = {
        ...(storedIntegration.credentials as any),
        // Include integration key if available
        integration_key: storedIntegration.integrationKey || undefined,
      };

      switch (storedIntegration.platform) {
        case 'wordpress':
          integration = new WordPressIntegration();
          break;
        case 'shopify':
          integration = new ShopifyIntegration();
          break;
        case 'webflow':
          integration = new WebflowIntegration();
          break;
        default:
          throw new APIError(400, 'Unsupported platform', ErrorCode.INVALID_PLATFORM);
      }
    } else {
      throw new APIError(400, 'No integration configured', ErrorCode.NO_INTEGRATION);
    }

    // Publish article
    const result = await integration.publish(credentials, {
      title: article.title,
      content: article.content,
      metaTitle: article.metaTitle || undefined,
      metaDescription: article.metaDescription || undefined,
      featuredImage: article.featuredImage || undefined,
      status: 'published',
    });

    if (!result.success) {
      throw new APIError(500, result.error || 'Failed to publish', ErrorCode.PUBLISH_FAILED);
    }

    // Update article status
    const updatedArticle = await db.article.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return successResponse({
      article: updatedArticle,
      publishResult: result,
    });
  } catch (error) {
    console.error('[Publish] Error:', error);
    return handleAPIError(error);
  }
}

