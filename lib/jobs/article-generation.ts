import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { articleGenerationQueue, QUEUE_NAMES } from './queue';
import { db } from '@/lib/db';
import { generateArticle } from '@/lib/services/article-generator';
import { analyzeSEO } from '@/lib/services/seo-analyzer';

interface ArticleGenerationJobData {
  projectId: string;
  keywordId?: string;
  keyword?: string;
  targetWordCount?: number;
}

/**
 * Process article generation job
 */
export async function processArticleGeneration(job: Job<ArticleGenerationJobData>) {
  const { projectId, keywordId, keyword, targetWordCount = 2000 } = job.data;

  console.log(`[Job] Generating article for project ${projectId}, keyword: ${keyword || keywordId}`);

  // Get project
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      articles: {
        select: { title: true },
        take: 10,
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Get keyword if keywordId provided
  let targetKeyword: string;
  let keywordRecord = null;

  if (keywordId) {
    keywordRecord = await db.keyword.findFirst({
      where: {
        id: keywordId,
        projectId,
        status: { in: ['unplanned', 'planned'] },
      },
    });

    if (!keywordRecord) {
      throw new Error(`Keyword ${keywordId} not found or already used`);
    }

    targetKeyword = keywordRecord.keyword;
  } else if (keyword) {
    targetKeyword = keyword;
  } else {
    // Get next planned keyword
    const nextKeyword = await db.keyword.findFirst({
      where: {
        projectId,
        status: 'planned',
        plannedDate: {
          lte: new Date(),
        },
      },
      orderBy: {
        plannedDate: 'asc',
      },
    });

    if (!nextKeyword) {
      throw new Error('No planned keywords available');
    }

    targetKeyword = nextKeyword.keyword;
    keywordRecord = nextKeyword;
  }

  // Generate article
  const generated = await generateArticle({
    keyword: targetKeyword,
    projectName: project.name,
    websiteUrl: project.websiteUrl,
    language: project.language,
    brandVoice: project.brandVoice as any,
    targetWordCount,
    existingArticles: project.articles.map((a) => a.title),
  });

  // Analyze SEO
  const seoAnalysis = analyzeSEO(
    generated.content,
    generated.metaTitle || generated.title,
    generated.metaDescription || '',
    targetKeyword
  );

  // Calculate metrics
  const wordCount = generated.wordCount;
  const headingCount = generated.headings.length;
  const paragraphCount = generated.content.split(/\n\n/).filter((p) => p.trim().length > 0).length;

  // Create article
  const article = await db.article.create({
    data: {
      projectId,
      keywordId: keywordRecord?.id,
      title: generated.title,
      content: generated.content,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      status: 'draft',
      wordCount,
      headingCount,
      paragraphCount,
      seoScore: seoAnalysis.score,
      keywordDensity: seoAnalysis.keywordDensity,
      internalLinks: seoAnalysis.internalLinks,
      externalLinks: seoAnalysis.externalLinks,
    },
  });

  // Mark keyword as used
  if (keywordRecord) {
    await db.keyword.update({
      where: { id: keywordRecord.id },
      data: { status: 'used' },
    });
  }

  // Auto-publish if enabled
  const settings = await db.projectSettings.findUnique({
    where: { projectId },
  });

  // Auto-publish functionality removed - articles are published manually or via integration
  // if (settings?.autoPublish) {
  //   // Queue publishing job
  //   await publishingQueue.add('auto-publish', {
  //     articleId: article.id,
  //     projectId,
  //   });
  // }

  return {
    articleId: article.id,
    title: article.title,
    seoScore: article.seoScore,
  };
}

/**
 * Create worker for article generation
 */
export function createArticleGenerationWorker() {
  // Only create worker if Redis is available
  if (!process.env.REDIS_URL) {
    console.warn('[Article Generation Worker] REDIS_URL not set - worker will not start');
    return null as any;
  }

  const REDIS_URL = process.env.REDIS_URL;
  return new Worker(QUEUE_NAMES.ARTICLE_GENERATION, processArticleGeneration, {
    connection: new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    }),
    concurrency: 3,
  });
}

