import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';

// GET /api/integrations/wordpress/verify - Verify access token
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Find integration by access token
    const integrations = await db.integration.findMany({
      where: {
        platform: 'wordpress',
        isActive: true,
      },
    });

    let integration = null;
    for (const int of integrations) {
      const creds = int.credentials as any;
      if (creds?.access_token === token) {
        // Check if token is expired
        if (creds.expires_at) {
          const expiresAt = new Date(creds.expires_at);
          if (expiresAt < new Date()) {
            continue; // Token expired
          }
        }
        integration = int;
        break;
      }
    }

    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return successResponse({
      valid: true,
      integration_id: integration.id,
      project_id: integration.projectId,
    });
  } catch (error) {
    console.error('[WordPress OAuth] Verify error:', error);
    return handleAPIError(error);
  }
}

