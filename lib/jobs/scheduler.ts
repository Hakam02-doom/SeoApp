import { articleGenerationQueue, publishingQueue, analyticsSyncQueue } from './queue';
import { db } from '@/lib/db';

/**
 * Schedule daily article generation for all active projects
 */
export async function scheduleDailyArticleGeneration() {
  console.log('[Scheduler] Scheduling daily article generation...');

  const projects = await db.project.findMany({
    where: {
      onboardingComplete: true,
    },
    include: {
      keywords: {
        where: {
          status: 'planned',
          plannedDate: {
            lte: new Date(),
          },
        },
        take: 1,
      },
    },
  });

  for (const project of projects) {
    if (project.keywords.length > 0) {
      await articleGenerationQueue.add(
        'daily-generation',
        {
          projectId: project.id,
        },
        {
          repeat: {
            pattern: '0 9 * * *', // Every day at 9 AM
          },
        }
      );
    }
  }

  console.log(`[Scheduler] Scheduled article generation for ${projects.length} projects`);
}

/**
 * Schedule publishing for scheduled articles
 */
export async function schedulePublishing() {
  console.log('[Scheduler] Checking for scheduled articles...');

  const scheduledArticles = await db.article.findMany({
    where: {
      status: 'scheduled',
      publishedAt: {
        lte: new Date(),
      },
    },
    include: {
      project: true,
    },
  });

  for (const article of scheduledArticles) {
    await publishingQueue.add('scheduled-publish', {
      articleId: article.id,
      projectId: article.projectId,
    });
  }

  console.log(`[Scheduler] Queued ${scheduledArticles.length} articles for publishing`);
}

/**
 * Schedule analytics sync for all projects
 */
export async function scheduleAnalyticsSync() {
  console.log('[Scheduler] Scheduling analytics sync...');

  const projects = await db.project.findMany({
    where: {
      onboardingComplete: true,
    },
  });

  for (const project of projects) {
    await analyticsSyncQueue.add(
      'daily-sync',
      {
        projectId: project.id,
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Every day at 2 AM
        },
      }
    );
  }

  console.log(`[Scheduler] Scheduled analytics sync for ${projects.length} projects`);
}

/**
 * Initialize all scheduled jobs
 */
export async function initializeScheduler() {
  console.log('[Scheduler] Initializing scheduler...');

  // Schedule daily article generation
  await scheduleDailyArticleGeneration();

  // Check for scheduled articles to publish
  await schedulePublishing();

  // Schedule analytics sync
  await scheduleAnalyticsSync();

  console.log('[Scheduler] Scheduler initialized');
}

