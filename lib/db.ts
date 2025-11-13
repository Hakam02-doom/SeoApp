import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with error handling
let db: PrismaClient;

try {
  // Clear existing Prisma instance to force new connections (fixes cached plan errors)
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma.$disconnect().catch(() => {
      // Ignore disconnect errors
    });
    globalForPrisma.prisma = undefined;
  }

  // Use direct connection (not pooled) to avoid Neon cached plan errors
  // Direct connections don't cache query plans, so schema changes work immediately
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
  
  db = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: databaseUrl ? {
      db: {
        url: databaseUrl,
      },
    } : undefined,
  });

  // Middleware to sync provider field and convert accessTokenExpiresAt DateTime to expires_at Int
  db.$use(async (params, next) => {
    if (params.model === 'Account') {
      if (params.action === 'create' || params.action === 'createMany') {
        if (params.args?.data) {
          const data = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
          data.forEach((item: any) => {
            // Sync provider with providerId
            if (item.providerId && !item.provider) {
              item.provider = item.providerId;
            }
            // Convert accessTokenExpiresAt DateTime to expires_at Int timestamp
            if (item.accessTokenExpiresAt instanceof Date) {
              item.expires_at = Math.floor(item.accessTokenExpiresAt.getTime() / 1000);
              // Keep accessTokenExpiresAt for Better Auth compatibility
            }
          });
        }
      } else if (params.action === 'update' || params.action === 'updateMany') {
        if (params.args?.data) {
          const updateData = params.args.data;
          // Sync provider with providerId
          if (updateData.providerId && !updateData.provider) {
            updateData.provider = updateData.providerId;
          }
          // Convert accessTokenExpiresAt DateTime to expires_at Int timestamp
          if (updateData.accessTokenExpiresAt instanceof Date) {
            updateData.expires_at = Math.floor(updateData.accessTokenExpiresAt.getTime() / 1000);
          }
        }
      }
    }
    return next(params);
  });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
} catch (error: any) {
  console.error('[Prisma] Failed to initialize Prisma Client:', error?.message || error);
  // Create a mock db object to prevent app crash
  db = {
    $connect: async () => {},
    $disconnect: async () => {},
    $transaction: async () => {},
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
  } as any;
  
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Prisma] Using mock database client. Set DATABASE_URL to enable database features.');
  }
}

export { db };
