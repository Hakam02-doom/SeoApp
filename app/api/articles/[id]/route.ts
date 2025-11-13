import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { WordPressIntegration } from '@/lib/integrations/wordpress';
import { z } from 'zod';

const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  keywordId: z.string().nullable().optional(),
});

// GET /api/articles/[id] - Get a single article
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    const article = await db.article.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true, name: true, websiteUrl: true },
        },
        keyword: true,
      },
    });

    if (!article || article.project.userId !== userId) {
      throw new APIError(404, 'Article not found', ErrorCode.NOT_FOUND);
    }

    return successResponse({ article });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH /api/articles/[id] - Update an article
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

    const validated = updateArticleSchema.parse(body);

    // Verify article belongs to user's project
    const existing = await db.article.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true, id: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Article not found', ErrorCode.NOT_FOUND);
    }

    // Verify keyword belongs to project if provided
    if (validated.keywordId !== undefined && validated.keywordId !== null) {
      const keyword = await db.keyword.findFirst({
        where: {
          id: validated.keywordId,
          projectId: existing.projectId,
        },
      });

      if (!keyword) {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.content !== undefined) {
      updateData.content = validated.content;
      // Recalculate metrics
      updateData.wordCount = validated.content.split(/\s+/).filter((w) => w.length > 0).length;
      updateData.headingCount = (validated.content.match(/^#+\s+/gm) || []).length;
      updateData.paragraphCount = validated.content.split(/\n\n/).filter((p) => p.trim().length > 0).length;
    }
    if (validated.metaTitle !== undefined) updateData.metaTitle = validated.metaTitle;
    if (validated.metaDescription !== undefined) updateData.metaDescription = validated.metaDescription;
    if (validated.featuredImage !== undefined) updateData.featuredImage = validated.featuredImage;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.publishedAt !== undefined) {
      updateData.publishedAt = validated.publishedAt 
        ? new Date(validated.publishedAt) 
        : null;
    }
    if (validated.keywordId !== undefined) {
      updateData.keywordId = validated.keywordId;
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return successResponse({ article: existing });
    }

    const article = await db.article.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            integrations: {
              where: { isActive: true, platform: 'wordpress' },
            },
          },
        },
        keyword: true,
      },
    });

    // Auto-publish to WordPress if status changed to published and integration exists
    // Only publish if status is being changed TO published (not if it was already published)
    const wasPublished = existing.status === 'published';
    const isBeingPublished = validated.status === 'published' && !wasPublished;

    if (isBeingPublished && article.project.integrations.length > 0) {
      const integration = article.project.integrations[0];
      
      // Check if integration is active
      if (!integration.isActive) {
        console.warn('[Auto-Publish] Integration is not active, skipping WordPress publish');
      } else {
        const credentials = {
          ...(integration.credentials as any),
          integration_key: integration.integrationKey || undefined,
        };

        // Only publish if we have the required credentials (integration key and WordPress URL)
        if (credentials.integration_key && credentials.url) {
          try {
            console.log('[Auto-Publish] Publishing article to WordPress...', {
              articleId: id,
              articleTitle: article.title,
              wordPressUrl: credentials.url,
              hasIntegrationKey: !!credentials.integration_key,
              integrationActive: integration.isActive,
            });

            const wordPressIntegration = new WordPressIntegration();
            const publishResult = await wordPressIntegration.publish(credentials, {
              title: article.title,
              content: article.content,
              metaTitle: article.metaTitle || undefined,
              metaDescription: article.metaDescription || undefined,
              featuredImage: article.featuredImage || undefined,
              status: 'published',
            });

            if (publishResult.success) {
              console.log('[Auto-Publish] ✅ Successfully published to WordPress:', publishResult.url);
              
              // Optionally store the WordPress post URL in the article
              // You could add a wordPressPostUrl field to the Article model if needed
            } else {
              console.error('[Auto-Publish] ❌ Failed to publish to WordPress:', {
                error: publishResult.error,
                articleId: id,
                articleTitle: article.title,
                wordPressUrl: credentials.url,
                hasIntegrationKey: !!credentials.integration_key,
              });
              // Log error but don't fail the article update
            }
          } catch (error: any) {
            console.error('[Auto-Publish] Error publishing to WordPress:', {
              error: error.message,
              stack: error.stack,
              articleId: id,
            });
            // Don't fail the article update if publishing fails
          }
        } else {
          console.warn('[Auto-Publish] ⚠️ Missing credentials for WordPress publishing:', {
            hasIntegrationKey: !!credentials.integration_key,
            hasUrl: !!credentials.url,
            integrationId: integration.id,
            credentialsKeys: Object.keys(credentials),
          });
        }
      }
    }

    return successResponse({ article });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE /api/articles/[id] - Delete an article
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    // Verify article belongs to user's project
    const existing = await db.article.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new APIError(404, 'Article not found', ErrorCode.NOT_FOUND);
    }

    await db.article.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}

