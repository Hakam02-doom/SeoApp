import { NextRequest, NextResponse } from 'next/server';
import { getAuthInstance } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: any;
}

/**
 * Get the current user from the session using Better Auth
 * Uses Better Auth's API directly instead of HTTP fetch
 */
export async function getCurrentUser(req: NextRequest): Promise<{ userId: string; user: any } | null> {
  try {
    // Get Better Auth instance
    const auth = getAuthInstance();
    
    // Convert NextRequest to standard Request for Better Auth
    const url = req.url;
    const headers = new Headers();
    
    // Copy all headers from NextRequest
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // Create a Request object that Better Auth can use
    const request = new Request(url, {
      method: req.method,
      headers: headers,
    });

    // Get session using Better Auth's API
    // Better Auth's getSession expects a Request object
    const session = await auth.api.getSession(request);

    if (!session || !session.user) {
      return null;
    }

    return {
      userId: session.user.id,
      user: session.user,
    };
  } catch (error: any) {
    console.error('[Auth Middleware] Error getting user:', error);
    console.error('[Auth Middleware] Error details:', error?.message, error?.stack);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string; user: any } | NextResponse> {
  const auth = await getCurrentUser(req);

  if (!auth) {
    console.log('[Auth Middleware] No user found in session');
    console.log('[Auth Middleware] Request URL:', req.url);
    console.log('[Auth Middleware] Cookies:', req.headers.get('cookie'));
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required. Please log in first.' },
      { status: 401 }
    );
  }

  return auth as { userId: string; user: any };
}

/**
 * Middleware to optionally get auth (doesn't fail if not authenticated)
 */
export async function optionalAuth(req: NextRequest): Promise<{ userId: string; user: any } | null> {
  return await getCurrentUser(req);
}

