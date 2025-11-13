import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  websiteUrl: z.string().url(),
  language: z.string().default('en'),
  brandVoice: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  websiteUrl: z.string().url().optional(),
  language: z.string().optional(),
  brandVoice: z.record(z.any()).optional(),
  onboardingComplete: z.boolean().optional(),
});

// GET /api/projects - List user's projects
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const projects = await db.project.findMany({
      where: { userId },
      include: {
        keywords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        articles: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            keywords: true,
            articles: true,
            backlinks: true,
            integrations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ projects });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();

    const validated = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        userId,
        name: validated.name,
        websiteUrl: validated.websiteUrl,
        language: validated.language,
        brandVoice: validated.brandVoice || undefined,
      },
    });

    return successResponse({ project }, 201);
  } catch (error) {
    return handleAPIError(error);
  }
}

