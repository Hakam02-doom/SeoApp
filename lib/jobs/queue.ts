import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Job queue names
export const QUEUE_NAMES = {
  ARTICLE_GENERATION: 'article-generation',
  PUBLISHING: 'publishing',
  ANALYTICS_SYNC: 'analytics-sync',
} as const;

// Lazy Redis connection - only create if REDIS_URL is provided
let redisConnection: Redis | null = null;
let connectionError: Error | null = null;

function getRedisConnection(): Redis | null {
  // If already tried and failed, don't retry
  if (connectionError) {
    return null;
  }

  // If connection exists, return it
  if (redisConnection) {
    return redisConnection;
  }

  // Only create connection if REDIS_URL is explicitly provided
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    // No Redis URL - queues will be disabled
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Queue] REDIS_URL not set - job queues will be disabled');
    }
    return null;
  }

  try {
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        // Don't retry if connection fails
        return null;
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Try to connect, but don't fail if it doesn't work
    redisConnection.connect().catch((err) => {
      console.warn('[Queue] Redis connection failed:', err.message);
      connectionError = err;
      redisConnection = null;
    });

    return redisConnection;
  } catch (error: any) {
    console.warn('[Queue] Failed to create Redis connection:', error?.message);
    connectionError = error;
    return null;
  }
}

// Create queues with optional connection
// If Redis is not available, queues will be created but won't work
// This allows the app to start without Redis
const connection = getRedisConnection();

export const articleGenerationQueue = connection
  ? new Queue(QUEUE_NAMES.ARTICLE_GENERATION, { connection })
  : (null as any);

export const publishingQueue = connection
  ? new Queue(QUEUE_NAMES.PUBLISHING, { connection })
  : (null as any);

export const analyticsSyncQueue = connection
  ? new Queue(QUEUE_NAMES.ANALYTICS_SYNC, { connection })
  : (null as any);

// Queue events for monitoring
export const articleGenerationEvents = connection
  ? new QueueEvents(QUEUE_NAMES.ARTICLE_GENERATION, { connection })
  : (null as any);

export const publishingEvents = connection
  ? new QueueEvents(QUEUE_NAMES.PUBLISHING, { connection })
  : (null as any);

export const analyticsSyncEvents = connection
  ? new QueueEvents(QUEUE_NAMES.ANALYTICS_SYNC, { connection })
  : (null as any);

// Helper function to check if queues are available
export function isQueueAvailable(): boolean {
  return connection !== null && connectionError === null;
}

