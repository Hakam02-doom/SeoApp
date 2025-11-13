import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const updateLanguageSchema = z.object({
  language: z.string().min(2).max(10),
  country: z.string().optional(),
});

// PATCH /api/projects/[id]/update-language - Update project language
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

    const validated = updateLanguageSchema.parse(body);

    // Verify project belongs to user
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update project language
    const updatedProject = await db.project.update({
      where: { id },
      data: {
        language: validated.language,
        // Store country in brandVoice or create a new field if needed
        brandVoice: project.brandVoice 
          ? { ...(project.brandVoice as any), country: validated.country }
          : { country: validated.country },
      },
    });

    return successResponse({ project: updatedProject });
  } catch (error) {
    return handleAPIError(error);
  }
}

