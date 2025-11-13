import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import crypto from 'crypto';

const authorizeSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().optional(),
  redirect_uri: z.string().url(),
  state: z.string(),
  scope: z.string().optional(),
  project_id: z.string().optional(), // Can be passed from frontend
});

// GET /api/integrations/wordpress/oauth/authorize - Initiate OAuth flow
// Note: This endpoint can be called without auth for WordPress plugin, but project_id should be validated
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const params = {
      response_type: searchParams.get('response_type') || 'code',
      client_id: searchParams.get('client_id') || undefined,
      redirect_uri: searchParams.get('redirect_uri') || '',
      state: searchParams.get('state') || '',
      scope: searchParams.get('scope') || 'publish read',
      project_id: searchParams.get('project_id') || undefined,
    };

    const validated = authorizeSchema.parse(params);

    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store authorization code (in production, use Redis or database)
    // For now, we'll encode it in the redirect URL
    // In production, store: code -> { userId, projectId, redirectUri, expiresAt }

    // Store authorization code temporarily (in production, use Redis)
    // For now, we'll encode project_id in the code itself
    // Format: code:project_id:timestamp
    const codeData = `${code}:${validated.project_id || ''}:${Date.now()}`;
    
    // Store in a simple in-memory cache (in production, use Redis)
    // For now, we'll pass project_id in the redirect
    
    // Build redirect URL with authorization code
    const redirectUrl = new URL(validated.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('state', validated.state);
    if (validated.project_id) {
      redirectUrl.searchParams.set('project_id', validated.project_id);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[WordPress OAuth] Authorize error:', error);
    return handleAPIError(error);
  }
}

