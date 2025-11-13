import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { createArticleGenerationWorker } from '@/lib/jobs/article-generation';
import { createPublishingWorker } from '@/lib/jobs/publishing';
import { createAnalyticsSyncWorker } from '@/lib/jobs/analytics-sync';
import { initializeScheduler } from '@/lib/jobs/scheduler';

// POST /api/jobs/start - Start background job workers
// This should be called when the server starts
export async function POST(req: NextRequest) {
  try {
    // Only allow in development or with admin auth
    if (process.env.NODE_ENV === 'production') {
      const auth = await requireAuth(req);
      if (auth instanceof NextResponse) return auth;
      // TODO: Check if user is admin
    }

    // Create workers
    const articleWorker = createArticleGenerationWorker();
    const publishingWorker = createPublishingWorker();
    const analyticsWorker = createAnalyticsSyncWorker();

    // Initialize scheduler
    await initializeScheduler();

    console.log('[Jobs] Background workers started');

    return successResponse({
      message: 'Background workers started',
      workers: ['article-generation', 'publishing', 'analytics-sync'],
    });
  } catch (error) {
    console.error('[Jobs] Error starting workers:', error);
    return handleAPIError(error);
  }
}

