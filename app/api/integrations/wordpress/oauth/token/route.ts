import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import crypto from 'crypto';

const tokenSchema = z.object({
  grant_type: z.enum(['refresh_token', 'authorization_code']),
  refresh_token: z.string().optional(),
  code: z.string().optional(),
  integration_id: z.string().optional(),
});

// POST /api/integrations/wordpress/oauth/token - Refresh access token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = tokenSchema.parse(body);

    if (validated.grant_type === 'refresh_token') {
      if (!validated.refresh_token) {
        return NextResponse.json(
          { error: 'refresh_token is required' },
          { status: 400 }
        );
      }

      // Find integration by refresh token
      const integrations = await db.integration.findMany({
        where: {
          platform: 'wordpress',
          isActive: true,
        },
      });

      let integration = null;
      for (const int of integrations) {
        const creds = int.credentials as any;
        if (creds?.refresh_token === validated.refresh_token) {
          integration = int;
          break;
        }
      }

      if (!integration) {
        return NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
      }

      // Generate new tokens
      const accessToken = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresIn = 3600; // 1 hour

      const credentials = {
        ...(integration.credentials as any),
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };

      await db.integration.update({
        where: { id: integration.id },
        data: {
          credentials: credentials as any,
        },
      });

      return successResponse({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported grant type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[WordPress OAuth] Token error:', error);
    return handleAPIError(error);
  }
}

