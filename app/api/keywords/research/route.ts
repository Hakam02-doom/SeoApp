import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { researchKeyword, researchKeywords } from '@/lib/services/keyword-research';
import { z } from 'zod';

const researchSchema = z.object({
  keyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  country: z.string().default('us'),
  language: z.string().default('en'),
});

// POST /api/keywords/research - Research keyword(s)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const validated = researchSchema.parse(body);

    if (validated.keyword) {
      // Single keyword research
      const result = await researchKeyword({
        keyword: validated.keyword,
        country: validated.country,
        language: validated.language,
      });

      return successResponse({ result });
    } else if (validated.keywords && validated.keywords.length > 0) {
      // Batch keyword research
      const results = await researchKeywords(
        validated.keywords,
        validated.country,
        validated.language
      );

      return successResponse({ results });
    } else {
      return NextResponse.json(
        { error: 'Either keyword or keywords array is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

