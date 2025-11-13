import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { generateBlogBackgroundImage } from '@/lib/services/image-generator';

// POST /api/articles/[id]/generate-background - Generate background image for article
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { id } = await params;

    // Get article
    const article = await db.article.findFirst({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
        keyword: true,
      },
    });

    if (!article || article.project.userId !== userId) {
      throw new APIError(404, 'Article not found', ErrorCode.NOT_FOUND);
    }

    // Generate background image
    const imageUrl = await generateBlogBackgroundImage({
      title: article.title,
      description: article.metaDescription || undefined,
      keyword: article.keyword?.keyword,
      style: 'gradient',
    });

    if (!imageUrl) {
      throw new APIError(500, 'Failed to generate background image', ErrorCode.IMAGE_GENERATION_FAILED);
    }

    // Update article with background image URL
    // Note: We'll store it in featuredImage for now, or add a new field later
    const updated = await db.article.update({
      where: { id },
      data: {
        featuredImage: imageUrl,
      },
    });

    return successResponse({ 
      imageUrl,
      article: updated,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

