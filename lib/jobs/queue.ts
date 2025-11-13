import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Job queue names
export const QUEUE_NAMES = {
  ARTICLE_GENERATION: 'article-generation',
  PUBLISHING: 'publishing',
  ANALYTICS_SYNC: 'analytics-sync',
} as const;

// Create queues
export const articleGenerationQueue = new Queue(QUEUE_NAMES.ARTICLE_GENERATION, {
  connection,
});

export const publishingQueue = new Queue(QUEUE_NAMES.PUBLISHING, {
  connection,
});

export const analyticsSyncQueue = new Queue(QUEUE_NAMES.ANALYTICS_SYNC, {
  connection,
});

// Queue events for monitoring
export const articleGenerationEvents = new QueueEvents(QUEUE_NAMES.ARTICLE_GENERATION, {
  connection,
});

export const publishingEvents = new QueueEvents(QUEUE_NAMES.PUBLISHING, {
  connection,
});

export const analyticsSyncEvents = new QueueEvents(QUEUE_NAMES.ANALYTICS_SYNC, {
  connection,
});

