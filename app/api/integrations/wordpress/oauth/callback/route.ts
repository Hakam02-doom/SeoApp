import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';
import crypto from 'crypto';

const callbackSchema = z.object({
  code: z.string(),
  redirect_uri: z.string().url(),
  project_id: z.string().optional(),
});

// POST /api/integrations/wordpress/oauth/callback - Exchange code for token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = callbackSchema.parse(body);

    // In production, verify the authorization code from your session store
    // For now, we'll accept the code and generate tokens
    // The code should be verified against what was stored during authorization

    // Generate access token and refresh token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour

    // Get project ID from query or body
    const { searchParams } = new URL(req.url);
    const projectId = validated.project_id || searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Get WordPress site URL from redirect_uri or from the callback
    // The redirect_uri should be the WordPress admin callback URL
    let wordpressUrl = '';
    try {
      const redirectUrl = new URL(validated.redirect_uri);
      // Extract WordPress site URL from the redirect URI
      // Format: https://wordpress-site.com/wp-admin/admin.php?page=rankyak-integration&action=oauth_callback
      wordpressUrl = `${redirectUrl.protocol}//${redirectUrl.host}`;
    } catch (e) {
      // If redirect_uri parsing fails, try to get from request
      wordpressUrl = req.headers.get('referer') || '';
    }

    // Find or create integration
    let integration = await db.integration.findFirst({
      where: {
        projectId,
        platform: 'wordpress',
      },
    });

    // Generate integration key
    const generateIntegrationKey = () => {
      return `rk_${crypto.randomBytes(24).toString('hex')}`;
    };

    let integrationKey: string;
    if (integration && integration.integrationKey) {
      // Use existing key
      integrationKey = integration.integrationKey;
    } else {
      // Generate new key
      integrationKey = generateIntegrationKey();
    }

    const credentials = {
      url: wordpressUrl,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      integration_key: integrationKey,
    };

    if (integration) {
      // Update existing integration
      const updateData: any = {
        credentials: credentials as any,
        isActive: true,
      };
      
      // Update integration key if it doesn't exist
      if (!integration.integrationKey) {
        updateData.integrationKey = integrationKey;
      }

      integration = await db.integration.update({
        where: { id: integration.id },
        data: updateData,
      });
    } else {
      // Create new integration with integration key
      integration = await db.integration.create({
        data: {
          projectId,
          platform: 'wordpress',
          credentials: credentials as any,
          isActive: true,
          integrationKey: integrationKey,
        },
      });
    }

    // Generate webhook URL for this integration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const webhookUrl = `${baseUrl}/api/integrations/wordpress/webhook?integration_id=${integration.id}`;

    return successResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      webhook_url: webhookUrl,
      integration_id: integration.id,
      integration_key: integration.integrationKey,
    });
  } catch (error) {
    console.error('[WordPress OAuth] Callback error:', error);
    return handleAPIError(error);
  }
}

