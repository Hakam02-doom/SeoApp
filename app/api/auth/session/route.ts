import { NextRequest, NextResponse } from 'next/server';
import { getAuthInstance } from '@/lib/auth';

// GET /api/auth/session - Get current session
export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = getAuthInstance();
    } catch (authError: any) {
      console.error('[Session Route] Failed to get auth instance:', authError);
      console.error('[Session Route] Auth error details:', authError?.message, authError?.stack);
      return NextResponse.json(null, { status: 200 });
    }
    
    if (!auth || !auth.api) {
      console.log('[Session Route] Auth instance or API not available');
      return NextResponse.json(null, { status: 200 });
    }
    
    // Log cookies for debugging
    const cookies = req.headers.get('cookie');
    console.log('[Session Route] Cookies:', cookies);
    
    // Convert NextRequest to Request for Better Auth
    // Better Auth needs the full request URL and headers
    const url = new URL(req.url);
    const headers = new Headers();
    
    // Copy all headers from NextRequest, especially cookies
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // Create a Request object that Better Auth can use
    const request = new Request(url.toString(), {
      method: req.method,
      headers: headers,
    });

    console.log('[Session Route] Calling auth.api.getSession...');
    
    // Get session using Better Auth's API
    let session;
    try {
      session = await auth.api.getSession(request);
    } catch (sessionError: any) {
      console.error('[Session Route] Error calling getSession:', sessionError);
      console.error('[Session Route] Session error details:', sessionError?.message, sessionError?.stack);
      return NextResponse.json(null, { status: 200 });
    }

    console.log('[Session Route] Session result:', session);

    if (!session || !session.user) {
      console.log('[Session Route] No session found');
      return NextResponse.json(null, { status: 200 });
    }

    console.log('[Session Route] Returning user:', session.user.id);
    return NextResponse.json({
      user: session.user,
      session: session,
    });
  } catch (error: any) {
    console.error('[Session Route] Top-level error:', error);
    console.error('[Session Route] Error message:', error?.message);
    console.error('[Session Route] Error stack:', error?.stack);
    return NextResponse.json(null, { status: 200 });
  }
}

