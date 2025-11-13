// Import Better Auth directly to get the actual instance
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from '@/lib/db';
import { toNextJsHandler } from 'better-auth/next-js';

// Initialize Better Auth with clean configuration
let authInstance: ReturnType<typeof betterAuth> | null = null;

function getAuthInstance() {
  if (!authInstance) {
    try {
      if (!process.env.DATABASE_URL) {
        console.warn('[Better Auth] DATABASE_URL not configured, using minimal config');
        // Return a minimal auth instance that won't crash
        authInstance = betterAuth({
          database: prismaAdapter(db, {
            provider: 'postgresql',
            usePlural: false,
          }),
          emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
          },
          baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
          secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-for-development-only-change-in-production',
        });
        return authInstance;
      }

      authInstance = betterAuth({
        database: prismaAdapter(db, {
          provider: 'postgresql',
          usePlural: false, // Use singular model names (User, not Users)
        }),
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
        },
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          },
        },
        account: {
          accountLinking: {
            enabled: true,
            // Allow linking accounts even if emails don't match
            allowDifferentEmails: true,
            // Trust Google as a provider for account linking
            trustedProviders: ['google'],
            // Allow updating user info when linking
            updateUserInfoOnLink: true,
          },
        },
        baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
        secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-for-development-only-change-in-production',
        session: {
          expiresIn: 60 * 60 * 24 * 7, // 7 days
          updateAge: 60 * 60 * 24, // 1 day
        },
        trustedOrigins: [
          process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
        ],
        logger: {
          level: 'debug',
          log: (level, message, ...args) => {
            if (level === 'error' || level === 'warn') {
              console.error(`[Better Auth ${level.toUpperCase()}]`, message, ...args);
              // Log full error details
              if (args.length > 0) {
                args.forEach((arg, index) => {
                  if (arg instanceof Error) {
                    console.error(`[Better Auth Error ${index}]`, arg.message);
                    console.error(`[Better Auth Error Stack ${index}]`, arg.stack);
                    // Log Prisma errors specifically
                    if (arg.message.includes('Prisma') || arg.message.includes('Unique constraint') || arg.message.includes('null value')) {
                      console.error(`[Better Auth Database Error]`, JSON.stringify(arg, null, 2));
                    }
                  } else if (typeof arg === 'object') {
                    console.error(`[Better Auth Error Object ${index}]`, JSON.stringify(arg, null, 2));
                  } else {
                    console.error(`[Better Auth Error ${index}]`, arg);
                  }
                });
              }
            } else {
              console.log(`[Better Auth ${level}]`, message, ...args);
            }
          },
        },
      });
      console.log('[Auth Route] Better Auth initialized successfully');
    } catch (error: any) {
      console.error('[Auth Route] Failed to initialize Better Auth:', error);
      throw error;
    }
  }
  return authInstance;
}

// Create the handler lazily to avoid initialization errors
let handler: ReturnType<typeof toNextJsHandler> | null = null;

function getHandler() {
  if (!handler) {
    try {
      const auth = getAuthInstance();
      handler = toNextJsHandler(auth);
    } catch (error: any) {
      console.error('[Auth Route] Failed to create handler:', error);
      // Return a handler that returns error responses
      handler = {
        GET: async () => new Response(JSON.stringify({ error: 'Auth initialization failed' }), { status: 500 }),
        POST: async () => new Response(JSON.stringify({ error: 'Auth initialization failed' }), { status: 500 }),
      } as any;
    }
  }
  return handler;
}

// Wrap handlers to catch and log errors
async function handleRequest(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  try {
    const url = new URL(req.url);
    console.log('========================================');
    console.log('[Auth Route Handler] Handling request:', url.pathname);
    console.log('[Auth Route Handler] Method:', req.method);
    console.log('[Auth Route Handler] Full URL:', url.toString());
    console.log('[Auth Route Handler] Search params:', url.search);
    
    // Special handling for callback routes
    if (url.pathname.includes('/callback')) {
      console.log('[Auth Route Handler] OAuth callback detected');
      console.log('[Auth Route Handler] Callback params:', Object.fromEntries(url.searchParams));
    }
    
    let response: Response;
    try {
      response = await handler(req);
    } catch (handlerError: any) {
      console.error('[Auth Route Handler] Handler threw an error:', handlerError);
      console.error('[Auth Route Handler] Error message:', handlerError?.message);
      console.error('[Auth Route Handler] Error stack:', handlerError?.stack);
      
      // Check for Prisma errors
      if (handlerError?.message?.includes('Prisma') || handlerError?.code === 'P2002' || handlerError?.code === 'P2003') {
        console.error('[Auth Route Handler] Prisma Error Details:', {
          code: handlerError?.code,
          meta: handlerError?.meta,
          message: handlerError?.message,
        });
      }
      
      // Return a proper error response
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: handlerError?.message || 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Log response details
    console.log('[Auth Route Handler] Response status:', response.status);
    console.log('[Auth Route Handler] Response headers:', Object.fromEntries(response.headers.entries()));
    
    // If it's an error response, try to log the body
    if (response.status >= 400) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        console.error('[Auth Route Handler] Error response body:', text);
        
        // Try to parse as JSON
        try {
          const json = JSON.parse(text);
          console.error('[Auth Route Handler] Error JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
          // Not JSON, that's fine
        }
      } catch (e) {
        console.error('[Auth Route Handler] Could not read error response body');
      }
    }
    
    // Check if response is a redirect with error
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log('[Auth Route Handler] Redirect to:', location);
        if (location.includes('error=') || location.includes('unable_to') || location.includes('internal_server')) {
          console.error('[Auth Route Handler] ⚠️ ERROR IN REDIRECT URL:', location);
          
          // Try to extract error details from URL
          try {
            const errorUrl = new URL(location);
            const errorParam = errorUrl.searchParams.get('error');
            if (errorParam) {
              console.error('[Auth Route Handler] Error code from URL:', errorParam);
            }
          } catch (e) {
            // Ignore URL parsing errors
          }
        }
      }
    }
    
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log('[Auth Route Handler] Set-Cookie:', setCookie);
    }
    
    console.log('========================================');
    
    return response;
  } catch (error: any) {
    console.error('[Auth Route Handler] Unhandled error:', error);
    console.error('[Auth Route Handler] Error message:', error?.message);
    console.error('[Auth Route Handler] Error stack:', error?.stack);
    
    // Check for specific database errors
    if (error?.message?.includes('Unique constraint')) {
      return new Response(
        JSON.stringify({
          error: 'Account already exists',
          message: 'This Google account is already linked to a user. Try signing in with email/password or use a different Google account.',
          code: 'ACCOUNT_EXISTS',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (error?.message?.includes('null value') || error?.message?.includes('NOT NULL')) {
      return new Response(
        JSON.stringify({
          error: 'Missing required data',
          message: 'Required user information is missing. Please try again.',
          code: 'MISSING_DATA',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(req: Request) {
  const h = getHandler();
  if (!h) {
    return new Response(JSON.stringify({ error: 'Auth initialization failed' }), { status: 500 });
  }
  return handleRequest(req, h.GET);
}

export async function POST(req: Request) {
  const h = getHandler();
  if (!h) {
    return new Response(JSON.stringify({ error: 'Auth initialization failed' }), { status: 500 });
  }
  return handleRequest(req, h.POST);
}