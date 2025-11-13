import { NextRequest, NextResponse } from 'next/server';
import { getAuthInstance } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Health check endpoint for debugging auth issues
 * GET /api/auth/health
 */
export async function GET(req: NextRequest) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Check environment variables
  checks.env = {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '❌ Missing',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || '❌ Missing',
    VERCEL_URL: process.env.VERCEL_URL || 'Not on Vercel',
  };

  // Check Better Auth initialization
  try {
    const auth = getAuthInstance();
    checks.betterAuth = {
      initialized: auth ? '✅ Yes' : '❌ No',
      hasApi: auth?.api ? '✅ Yes' : '❌ No',
    };
  } catch (error: any) {
    checks.betterAuth = {
      initialized: '❌ Failed',
      error: error?.message || 'Unknown error',
    };
  }

  // Check database connection
  try {
    await db.$connect();
    checks.database = {
      connected: '✅ Yes',
    };
    await db.$disconnect();
  } catch (error: any) {
    checks.database = {
      connected: '❌ No',
      error: error?.message || 'Unknown error',
    };
  }

  // Check origin
  const origin = req.headers.get('origin') || req.headers.get('referer') || 'unknown';
  checks.request = {
    origin,
    url: req.url,
  };

  // Determine overall health
  const isHealthy = 
    checks.env.DATABASE_URL === '✅ Set' &&
    checks.env.BETTER_AUTH_SECRET === '✅ Set' &&
    checks.betterAuth.initialized === '✅ Yes' &&
    checks.database.connected === '✅ Yes';

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  }, {
    status: isHealthy ? 200 : 503,
  });
}

