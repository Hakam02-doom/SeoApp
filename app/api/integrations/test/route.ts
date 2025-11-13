import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { WordPressIntegration } from '@/lib/integrations/wordpress';
import { ShopifyIntegration } from '@/lib/integrations/shopify';
import { WebflowIntegration } from '@/lib/integrations/webflow';
import { z } from 'zod';

const testSchema = z.object({
  platform: z.enum(['wordpress', 'shopify', 'webflow']),
  credentials: z.record(z.any()),
});

// POST /api/integrations/test - Test integration connection
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const validated = testSchema.parse(body);

    let integration;
    switch (validated.platform) {
      case 'wordpress':
        integration = new WordPressIntegration();
        break;
      case 'shopify':
        integration = new ShopifyIntegration();
        break;
      case 'webflow':
        integration = new WebflowIntegration();
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    const isConnected = await integration.testConnection(validated.credentials);

    return successResponse({
      connected: isConnected,
      platform: validated.platform,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

