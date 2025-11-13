import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const createArticleSchema = z.object({
  projectId: z.string(),
  keywordId: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
  publishedAt: z.string().datetime().optional(),
});

// GET /api/articles - List articles with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const keywordId = searchParams.get('keywordId');
    const search = searchParams.get('search');

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

    if (status) {
      where.status = status;
    }

    if (keywordId) {
      where.keywordId = keywordId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const articles = await db.article.findMany({
      where,
      include: {
        keyword: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ articles });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/articles - Create an article
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = createArticleSchema.parse(body);

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

    // Verify keyword belongs to project if provided
    if (validated.keywordId) {
      const keyword = await db.keyword.findFirst({
        where: {
          id: validated.keywordId,
          projectId: validated.projectId,
        },
      });

      if (!keyword) {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        );
      }
    }

    // Calculate word count and other metrics
    const wordCount = validated.content.split(/\s+/).filter((w) => w.length > 0).length;
    const headingCount = (validated.content.match(/^#+\s+/gm) || []).length;
    const paragraphCount = validated.content.split(/\n\n/).filter((p) => p.trim().length > 0).length;

    const article = await db.article.create({
      data: {
        projectId: validated.projectId,
        keywordId: validated.keywordId,
        title: validated.title,
        content: validated.content,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        featuredImage: validated.featuredImage,
        status: validated.status,
        publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : undefined,
        wordCount,
        headingCount,
        paragraphCount,
      },
    });

    return successResponse({ article }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

