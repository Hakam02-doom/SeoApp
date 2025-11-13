import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { publishingQueue, QUEUE_NAMES } from './queue';
import { db } from '@/lib/db';
import { WordPressIntegration } from '@/lib/integrations/wordpress';
import { ShopifyIntegration } from '@/lib/integrations/shopify';
import { WebflowIntegration } from '@/lib/integrations/webflow';

interface PublishingJobData {
  articleId: string;
  projectId: string;
  integrationId?: string;
}

/**
 * Process publishing job
 */
export async function processPublishing(job: Job<PublishingJobData>) {
  const { articleId, projectId, integrationId } = job.data;

  console.log(`[Job] Publishing article ${articleId} for project ${projectId}`);

  // Get article
  const article = await db.article.findUnique({
    where: { id: articleId },
    include: {
      project: {
        include: {
          integrations: {
            where: integrationId
              ? { id: integrationId, isActive: true }
              : { isActive: true },
          },
        },
      },
    },
  });

  if (!article || article.projectId !== projectId) {
    throw new Error(`Article ${articleId} not found`);
  }

  if (article.project.integrations.length === 0) {
    throw new Error('No active integrations configured');
  }

  const integration = article.project.integrations[0];
  const credentials = integration.credentials as any;

  // Get appropriate integration handler
  let integrationHandler;
  switch (integration.platform) {
    case 'wordpress':
      integrationHandler = new WordPressIntegration();
      break;
    case 'shopify':
      integrationHandler = new ShopifyIntegration();
      break;
    case 'webflow':
      integrationHandler = new WebflowIntegration();
      break;
    default:
      throw new Error(`Unsupported platform: ${integration.platform}`);
  }

  // Publish article
  const result = await integrationHandler.publish(credentials, {
    title: article.title,
    content: article.content,
    metaTitle: article.metaTitle || undefined,
    metaDescription: article.metaDescription || undefined,
    featuredImage: article.featuredImage || undefined,
    status: 'published',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to publish');
  }

  // Update article status
  await db.article.update({
    where: { id: articleId },
    data: {
      status: 'published',
      publishedAt: new Date(),
    },
  });

  return {
    articleId,
    url: result.url,
    postId: result.postId,
  };
}

/**
 * Create worker for publishing
 */
export function createPublishingWorker() {
  // Only create worker if Redis is available
  if (!process.env.REDIS_URL) {
    console.warn('[Publishing Worker] REDIS_URL not set - worker will not start');
    return null as any;
  }

  const REDIS_URL = process.env.REDIS_URL;
  return new Worker(QUEUE_NAMES.PUBLISHING, processPublishing, {
    connection: new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    }),
    concurrency: 5,
  });
}

